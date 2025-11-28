// CHANGE 1: Direct import for Fabric v6
import { Triangle } from "fabric"; 

// CONFIGURATION
const API_URL = "http://localhost:3000/api";

async function main() {
  console.log("🚀 Starting initialization sequence...");

  // 1. CREATE USER
  console.log("1️⃣  Creating User...");
  // Use a unique email every time to avoid 409 Conflict errors
  const userRes = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `fabric-${Date.now()}@test.com`, name: "Fabric Bot" }),
  });
  const user = await userRes.json();
  if (user.error) throw new Error(`User Error: ${user.error}`);
  console.log(`   ✅ User Created: ${user.id}`);

  // 2. CREATE BOARD
  console.log("2️⃣  Creating Board...");
  const boardRes = await fetch(`${API_URL}/boards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Fabric Generated Board", ownerId: user.id }),
  });
  const board = await boardRes.json();
  if (board.error) throw new Error(`Board Error: ${board.error}`);
  console.log(`   ✅ Board Created: ${board.id}`);

  // 3. CREATE PAGE
  console.log("3️⃣  Creating Page...");
  const pageRes = await fetch(`${API_URL}/pages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ boardId: board.id, name: "Triangle Page" }),
  });
  const page = await pageRes.json();
  if (page.error) throw new Error(`Page Error: ${page.error}`);
  console.log(`   ✅ Page Created: ${page.id} (Version: ${page.version})`);

  // =================================================================
  // 4. THE FABRIC.JS LOGIC
  // =================================================================
  console.log("4️⃣  Generating Triangle using Fabric.js...");

  // CHANGE 2: Use 'new Triangle' directly (without fabric. prefix)
  const triangle = new Triangle({
    width: 200,
    height: 200,
    fill: '#ff5555',
    stroke: 'black',
    strokeWidth: 5,
    left: 500,
    top: 300,
    angle: 0
  });

  const fabricObject = triangle.toObject();

  // Mapping Fabric Object to your Domain Schema
  const shapeId = `shape-${Date.now()}`;
  const layerId = `layer-${Date.now()}`;

  const dbShape = {
    id: shapeId,
    layerId: layerId,
    kind: "path", 
    x: fabricObject.left,
    y: fabricObject.top,
    w: fabricObject.width,
    h: fabricObject.height,
    rotation: fabricObject.angle,
    // Calculate simple triangle path for the 'd' attribute
    d: `M 0 ${fabricObject.height} L ${fabricObject.width / 2} 0 L ${fabricObject.width} ${fabricObject.height} z`,
    style: {
      fill: fabricObject.fill,
      stroke: fabricObject.stroke,
      strokeWidth: fabricObject.strokeWidth
    },
    meta: {
      fabricType: fabricObject.type
    }
  };

  const layer = {
    id: layerId,
    pageId: page.id,
    name: "Layer 1",
    visible: true,
    objectIds: [shapeId],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // 5. SEND THE PATCH
  console.log("5️⃣  Sending Patch to API...");
  
  const patchBody = {
    baseVersion: page.version,
    userId: user.id,
    patches: [
      { op: "add", path: `/layers/${layerId}`, value: layer },
      { op: "add", path: `/shapes/${shapeId}`, value: dbShape }
    ]
  };

  const patchRes = await fetch(`${API_URL}/pages/${page.id}/content`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patchBody),
  });

  const patchResult = await patchRes.json();
  
  if (patchResult.error) {
    console.error("❌ Failed:", patchResult.error);
  } else {
    console.log("✨ SUCCESS! Triangle added.");
    console.log(`🔗 Verify here: GET ${API_URL}/pages/${page.id}`);
  }
}

main().catch(console.error);