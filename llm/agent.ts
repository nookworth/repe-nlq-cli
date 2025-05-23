import { ChatOpenAI } from "@langchain/openai";
import { StructuredToolInterface } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, BaseMessage, HumanMessage, trimMessages } from "@langchain/core/messages";
import input from '@inquirer/input'

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

const agent = async () => {
  try {
    await client.connect(transport)

    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      apiKey: process.env.OPENAI_API_KEY,
    });
    const messages: BaseMessage[] = [];
    const toolList = await client.listTools();
    const tools = new ToolNode(toolList.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      schema: tool.inputSchema,
    })) as unknown as StructuredToolInterface[])
    const agent = createReactAgent({ llm, tools });

    while (true) {
      const userInput = await input({
        message: "Enter a query:",
      });

      messages.push(new HumanMessage(userInput));

      const result = await agent.invoke({ messages });
      const lastMessage = result.messages[result.messages.length - 1] instanceof AIMessage ? result.messages[result.messages.length - 1] : null;
      messages.push(new AIMessage(lastMessage));
      console.log(lastMessage.content);
      console.log(messages)
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

export default agent;