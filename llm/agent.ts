import { ChatOpenAI } from "@langchain/openai";
import { StructuredToolInterface } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const agent = async () => {
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

  await client.connect(transport)

  const toolList = await client.listTools();
  const tools = new ToolNode(toolList.tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    schema: tool.inputSchema,
  })) as unknown as StructuredToolInterface[])

  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
  });

  const agent = createReactAgent({ llm: model, tools: tools });

  const inputs = {
    messages: [{ role: "user", content: "what is the weather in SF?" }],
  };

  const stream = await agent.stream(inputs, { streamMode: "values" });

  for await (const { messages } of stream) {
    console.log(messages);
  }
}

export default agent;