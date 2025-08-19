import PDFDocument from "pdfkit";

export async function generateCertificatePdfBuffer(params: {
	participantName: string;
	eventName: string;
	role?: string;
	issuedAt?: Date;
}): Promise<Buffer> {
	return await new Promise((resolve) => {
		const doc = new PDFDocument({ size: "A4" });
		const chunks: Buffer[] = [];
		doc.on("data", (chunk) => chunks.push(chunk as Buffer));
		doc.on("end", () => resolve(Buffer.concat(chunks)));

		doc.rect(30, 30, 535, 780).stroke();
		doc.fontSize(24).text("Certificate of Participation", { align: "center", underline: true });
		doc.moveDown(2);
		doc.fontSize(16).text(`This is to certify that`, { align: "center" });
		doc.moveDown(1);
		doc.fontSize(22).text(params.participantName, { align: "center" });
		doc.moveDown(1);
		doc.fontSize(16).text(`has participated in ${params.eventName}.`, { align: "center" });
		doc.moveDown(2);
		doc.fontSize(12).text(`Issued: ${(params.issuedAt ?? new Date()).toDateString()}`, { align: "center" });

		doc.end();
	});
}



