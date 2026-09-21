import { NextResponse } from "next/server";
import { db } from "@/db";
import { materialMasters, auditLogs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { standardizeMaterial } from "@/lib/ai/standardizer";
import { parse } from "papaparse";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const cpseId = Number(formData.get("cpseId"));

    if (!file || !cpseId) {
      return NextResponse.json(
        { success: false, message: "File and cpseId required" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const parsed = parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    });

    const rows = parsed.data;
    const inserted: number[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const description = row.description || row.material_description || row.desc || "";
        const legacyCode = row.legacy_code || row.material_code || row.code || `ROW-${i + 1}`;
        const uom = row.uom || row.unit_of_measurement || row.unit || "NOS";
        if (!description) continue;

        const specs: Record<string, unknown> = {};
        Object.entries(row).forEach(([k, v]) => {
          if (v && !["description", "material_description", "desc", "legacy_code", "material_code", "code", "uom", "unit_of_measurement", "unit", "category", "sub_category", "manufacturer_part_number", "mpn", "plant_code"].includes(k)) {
            specs[k] = v;
          }
        });

        const standardized = standardizeMaterial({
          description,
          technicalSpecifications: specs,
          unitOfMeasurement: uom,
        });

        const [mm] = await db
          .insert(materialMasters)
          .values({
            cpseId,
            legacyCode,
            description,
            technicalSpecifications: standardized.normalizedSpecs,
            unitOfMeasurement: uom,
            category: standardized.category,
            subCategory: standardized.subCategory,
            rawData: row,
          })
          .onConflictDoUpdate({
            target: [materialMasters.cpseId, materialMasters.legacyCode],
            set: {
              description,
              technicalSpecifications: standardized.normalizedSpecs,
              unitOfMeasurement: uom,
              category: standardized.category,
              subCategory: standardized.subCategory,
              rawData: row,
              lastImportedAt: new Date(),
              updatedAt: new Date(),
            },
          })
          .returning();
        inserted.push(mm.id);
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    await db.insert(auditLogs).values({
      userId: user.id,
      action: "import",
      entityType: "material_masters",
      newValues: { cpseId, fileName: file.name, inserted: inserted.length, errors: errors.length },
    });

    return NextResponse.json({
      success: true,
      data: { inserted: inserted.length, errors },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
