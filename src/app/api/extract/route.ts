import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { AuthenticationError, requireAuthenticatedUser } from "@/auth/server-auth";
import { isTrustedDemoRequest } from "@/auth/request-policy";

export async function POST(req: NextRequest) {
  try {
    const demoRequest = isTrustedDemoRequest(
      process.env.SKILLSTATE_AI_MODE,
      req.headers.get("x-skillstate-demo")
    );
    if (!demoRequest) await requireAuthenticatedUser(req);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = (formData.get("documentType") as string) || "resume";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds the 10 MB limit." }, { status: 413 });
    }

    const filename = file.name;
    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let extractedText = "";

    if (ext === ".txt") {
      extractedText = buffer.toString("utf-8");
    } else if (ext === ".docx") {
      const docxResult = await mammoth.extractRawText({ buffer });
      extractedText = docxResult.value;
    } else if (ext === ".pdf") {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || "";
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
        { status: 400 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: "No readable text was found in this document.", status: "failed" },
        { status: 422 }
      );
    }

    const wordCount = extractedText.trim().split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      success: true,
      filename,
      documentType,
      sizeBytes: file.size,
      wordCount,
      extractedText: extractedText.trim(),
      status: "extracted",
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const errMessage = error instanceof Error ? error.message : "Extraction failed";
    return NextResponse.json(
      { error: errMessage, status: "failed" },
      { status: 500 }
    );
  }
}
