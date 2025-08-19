import { BlobServiceClient } from "@azure/storage-blob";
import { randomUUID } from "crypto";

const { AZURE_BLOB_CONNECTION_STRING = "", AZURE_BLOB_CONTAINER = "hackhub" } = process.env;

export async function uploadBufferToBlob(buffer: Buffer, opts?: { contentType?: string; prefix?: string }) {
	const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_BLOB_CONNECTION_STRING);
	const containerClient = blobServiceClient.getContainerClient(AZURE_BLOB_CONTAINER);
	await containerClient.createIfNotExists();
	const blobName = `${opts?.prefix ?? "uploads"}/${randomUUID()}`;
	const blockBlobClient = containerClient.getBlockBlobClient(blobName);
	await blockBlobClient.uploadData(buffer, { blobHTTPHeaders: { blobContentType: opts?.contentType ?? "application/octet-stream" } });
	return {
		blobName,
		url: blockBlobClient.url,
	};
}



