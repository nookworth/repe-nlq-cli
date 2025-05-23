import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { loadMcpTools } from "@langchain/mcp-adapters";
import input from '@inquirer/input'

const transport = new StdioClientTransport({
    command: "tsx",
    args: ["server/mcp/server.ts"]
  });

  const client = new Client(
    {
      name: "plaza-demo-client",
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
    const messages: BaseMessage[] = [
      new SystemMessage(
        `
        You are a helpful assistant that can answer questions about the database.
        Assume all database-related questions are about the rent_roll table.
        If a user asks you a question about the database, translate it into a SQL query.
        Then use the query tool to execute the query and return the results.
        Examples of terms the user may use to intend a query about the database:
        - "What is the total rent for all units?"
        - "Give me a list of all the units that are currently occupied."
        - "Select all units that are currently occupied where the rent is greater than $1000 and return their tenants in alphabetical order."
        - "Which units were moved in after 2024-01-01?"
        `
      ),
    ];
    const tools = await loadMcpTools("plaza-demo-server", client, {
      throwOnLoadError: true,
      prefixToolNameWithServerName: false,
      additionalToolNamePrefix: "",
    });
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
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

export default agent;