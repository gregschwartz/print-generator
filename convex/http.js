import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/sendImage",
  method: "POST",
  handler: httpAction(async ({ storage, runMutation }, request) => {
    // Step 1: Store the file
    const blob = await request.blob();
    const storageId = await storage.store(blob);

    // Step 2: Save the storage ID to the database via a mutation
    const author = new URL(request.url).searchParams.get("author");
    await runMutation("sendImage", { prompt, storageId });

    // Step 3: Return a response with the correct CORS headers
    return new Response(null, {
      status: 200,
      // CORS headers
      headers: new Headers({
        // e.g. https://mywebsite.com
        "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN,
        Vary: "origin",
      }),
    });
  }),
});

export default http;