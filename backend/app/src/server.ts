import type { WSContext } from 'hono/ws'
import process from 'node:process'
import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { Hono } from 'hono'

import { env } from 'hono/adapter'
import z from 'zod'

const app = new Hono()

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

app.get('/', (c) => {
  const { URL } = env<{ URL: string }>(c)
  return c.html(`<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mini WebSocket Client</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: black;
      }
      body {
        margin: 200px 10%;
        background-color: cadetblue;
      }
      h1 {
        margin: 10px 0;
      }
      h2 {
        margin: 10px 0;
      }
      #connect h2 {
        color: orange;
        font-weight: 600;
      }
      #message {
        display: grid;
        gap: 20px;
      }
      #message p {
        background-color: aliceblue;
        padding: 15px;
        border-radius: 10px;
      }
    </style>
  </head>
  <body>
    <h1 class="title">Mini WebSocket Client</h1>
    <div id="connect"></div>
    <div id="message"></div>
    <button id="send">Send Message</button>
  </body>
  <script>
    const socket = new WebSocket("${URL}" + "/wss");

    socket.addEventListener("open", (event) => {
      // 受信開始を表示
      const h2 = document.createElement("h2");
      h2.innerText = "Connected to server";
      document.getElementById("connect").appendChild(h2);
    });

    socket.addEventListener("message", (event) => {
      // メッセージを表示
      const p = document.createElement("p");
      // 月/日/年 時:分:秒.ミリ秒
      const date = new Date().toLocaleString();
      p.innerText = date + "|" + event.data;
      document.getElementById("message").appendChild(p);
    });

    socket.addEventListener("error", (event) => {
      // エラーメッセージを追加
      const p = document.createElement("p");
      p.innerText = "WebSocket connection failed";
      document.getElementById("message").appendChild(p);
    });

    socket.addEventListener("close", (event) => {
      // 接続が閉じられたことを表示
      const p = document.createElement("p");
      p.innerText = "WebSocket connection closed";
      document.getElementById("message").appendChild(p);
    });

    document.getElementById("send").addEventListener("click", () => {
      // メッセージを送信
      const message = "Hello, WebSocket!";
      socket.send(message);
      console.log("Sent message:", message);
    });
  </script>
</html>`)
})

export const zSendMessage = z.object({
  type: z.enum(['open', 'message', 'close', 'error']),
  data: z.union([z.string(), z.instanceof(ArrayBuffer), z.unknown()]),
})

export type ZSendMessage = z.infer<typeof zSendMessage>

const clients = new Set<WSContext>()

app.get(
  '/wss',
  upgradeWebSocket(() => {
    return {
      async onOpen(_, ws) {
        clients.add(ws)
        Array.from(clients).forEach((client) => {
          const message: ZSendMessage = {
            type: 'open',
            data: 'New client connected',
          }
          client.send(JSON.stringify(message))
        })
      },
      async onMessage(event, ws) {
        Array.from(clients).forEach((client) => {
          if (client !== ws) {
            const message: ZSendMessage = {
              type: 'message',
              data: event.data,
            }
            client.send(JSON.stringify(message))
          }
        })
      },
      async onClose(_, ws) {
        console.log('Connection closed')
        clients.delete(ws)
      },
      async onError(_) {
        console.error('WebSocket error')
      },
    }
  }),
)

const port = Number(process.env.PORT) || 3000
console.log(`Server listening on port ${port}`)

const server = serve({
  fetch: app.fetch,
  port,
})

injectWebSocket(server)
