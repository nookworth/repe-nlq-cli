import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "tsx",
  args: ["server/mcp/server.ts"]
});

const client = new Client(
  {
    name: "Plaza Demo Client",
    version: "1.0.0"
  }
);

export const query = async () => {
    await client.connect(transport);
    const tools = await client.listTools();
    const resources = await client.listResources();
    console.log({ tools, resources });
}