import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-9613434f/health", (c) => {
  return c.json({ status: "ok" });
});

// Config endpoint - retorna informações públicas do Supabase
app.get("/make-server-9613434f/config", (c) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const projectId = supabaseUrl.replace("https://", "").replace(".supabase.co", "");

  return c.json({
    success: true,
    data: {
      projectId,
      publicAnonKey: Deno.env.get("SUPABASE_ANON_KEY") || "",
    }
  });
});

// ============================================
// LOCATIONS API - GeoParques SM
// ============================================

// GET /locations - Listar todos os locais
app.get("/make-server-9613434f/locations", async (c) => {
  try {
    const locations = await kv.getByPrefix("location:");
    return c.json({ success: true, data: locations });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /locations/:id - Buscar local por ID
app.get("/make-server-9613434f/locations/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const location = await kv.get(`location:${id}`);

    if (!location) {
      return c.json({ success: false, error: "Location not found" }, 404);
    }

    return c.json({ success: true, data: location });
  } catch (error) {
    console.error("Error fetching location:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /locations - Criar novo local
app.post("/make-server-9613434f/locations", async (c) => {
  try {
    const body = await c.req.json();
    const { title, latitude, longitude, status, region, category, description, address, seiProcess, images } = body;

    // Validação básica
    if (!title || latitude === undefined || longitude === undefined || !status || !region || !category) {
      return c.json({
        success: false,
        error: "Missing required fields: title, latitude, longitude, status, region, category"
      }, 400);
    }

    const id = crypto.randomUUID();
    const location = {
      id,
      title,
      latitude,
      longitude,
      status,
      region,
      category,
      description: description || "",
      address: address || "",
      seiProcess: seiProcess || "",
      images: images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`location:${id}`, location);

    return c.json({ success: true, data: location }, 201);
  } catch (error) {
    console.error("Error creating location:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /locations/:id - Atualizar local
app.put("/make-server-9613434f/locations/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const existingLocation = await kv.get(`location:${id}`);

    if (!existingLocation) {
      return c.json({ success: false, error: "Location not found" }, 404);
    }

    const updatedLocation = {
      ...existingLocation,
      ...body,
      id, // Garantir que o ID não mude
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`location:${id}`, updatedLocation);

    return c.json({ success: true, data: updatedLocation });
  } catch (error) {
    console.error("Error updating location:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /locations/:id - Deletar local
app.delete("/make-server-9613434f/locations/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const existingLocation = await kv.get(`location:${id}`);

    if (!existingLocation) {
      return c.json({ success: false, error: "Location not found" }, 404);
    }

    await kv.del(`location:${id}`);

    return c.json({ success: true, message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /locations - Deletar TODOS os locais (útil para limpar dados mock)
app.delete("/make-server-9613434f/locations", async (c) => {
  try {
    const locations = await kv.getByPrefix("location:");

    if (locations.length === 0) {
      return c.json({ success: true, message: "No locations to delete", count: 0 });
    }

    // Deletar todos os locais
    const deletePromises = locations.map((location) =>
      kv.del(`location:${location.id}`)
    );

    await Promise.all(deletePromises);

    return c.json({
      success: true,
      message: `${locations.length} locations deleted successfully`,
      count: locations.length
    });
  } catch (error) {
    console.error("Error deleting all locations:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

Deno.serve(app.fetch);