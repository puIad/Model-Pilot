import { runFullCalibrationSuite } from "@/lib/calibration/evaluator";
import { parseModelList } from "@/lib/models/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const report = runFullCalibrationSuite();
    return NextResponse.json(report);
  } catch (error) {
    console.error("Calibration suite failed:", error);
    return NextResponse.json(
      { error: "Failed to execute calibration suite." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    let customModels = undefined;
    try {
      const body = await req.json();
      if (body?.models !== undefined) {
        const parsed = parseModelList(body.models);
        if (!parsed) {
          return NextResponse.json({ error: "The model catalog is invalid." }, { status: 400 });
        }
        customModels = parsed;
      }
    } catch {
      // Body optional
    }

    const report = runFullCalibrationSuite(customModels);
    return NextResponse.json(report);
  } catch (error) {
    console.error("Calibration suite failed:", error);
    return NextResponse.json(
      { error: "Failed to execute calibration suite." },
      { status: 500 }
    );
  }
}
