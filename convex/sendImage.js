import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation(async ({ storage }) => {
  return await storage.generateUploadUrl();
});

export const sendImage = mutation(async ({ db }, { prompt, storageId }) => {
  const image = { body: storageId, prompt, format: "image" };
  await db.insert("images", image);
});