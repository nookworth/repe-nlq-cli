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

  const run = async (agent, messages: BaseMessage[]) => {
    const userInput = await input({
      message: "Enter a query:",
    });

    if (userInput === "exit") {
      return;
    }

    messages.push(new HumanMessage(userInput));
    const result = await agent.invoke({ messages });
    console.log(result)

    const lastMessage = result.messages[result.messages.length - 1] instanceof AIMessage ? result.messages[result.messages.length - 1] : null;
    messages.push(new AIMessage(lastMessage));
    // console.log(lastMessage?.content);

    return await run(agent, messages);
  }

const agent = async () => {
  try {
    await client.connect(transport)

    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      apiKey: process.env.OPENAI_API_KEY,
    });
    const messages: BaseMessage[] = [
      new SystemMessage(
        `You are a helpful assistant that can answer questions about the database.
        Assume all database-related questions are about the rent_roll table.
        If a user asks you a question about the database, translate it into a SQL query.
        Then use the query tool to execute the query and return the results.
        Examples of terms the user may use to intend a query about the database and how to translate them into a SQL query:
        - "What is the total rent for all units?" = SELECT SUM(autobill) FROM rent_roll
        - "Select all units where the rent is greater than $1000 and return their tenants in alphabetical order." = SELECT name FROM rent_roll WHERE autobill > 1000 ORDER BY name ASC
        - "Which units were moved in after 2024-01-01?" = SELECT unit FROM rent_roll WHERE moved_in > '2024-01-01'
        The database schema is as follows:
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          unit TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          sq_ft INTEGER,
          autobill DECIMAL(10,2) NOT NULL,
          deposit DECIMAL(10,2) NOT NULL,
          moved_in DATE,
          lease_ends DATE,
          status TEXT NOT NULL`
      ),
    ];
    const tools = await loadMcpTools("plaza-demo-server", client, {
      throwOnLoadError: true,
      prefixToolNameWithServerName: false,
      additionalToolNamePrefix: "",
    });
    const agent = createReactAgent({ llm, tools });

    await run(agent, messages);
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

export default agent;