import express from "express";
import { WebSocketServer } from "ws";
import protobufjs from "protobufjs";

import { cmd } from "./cmd.js";

const PORT = 9876;

const server = express().listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
const wss = new WebSocketServer({ server });
wss.binaryType = "arraybuffer";

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (data, binary) => {
    if (binary) {
      decodeCmd(data);

      setTimeout(() => {
        sendMessage(ws);
      }, 3000);
    }
  });

  ws.on("close", () => {
    console.log("Close connected");
  });
});

// 0 => serviceType  1 => cmdType
const decodeCmd = (data) => {
  const serviceType = data.readUInt16LE(0);
  const cmdType = data.readUInt16LE(2);
  const msgBuf = Buffer.from(data).subarray(8, data.length);

  //載入 Product.proto 檔案
  protobufjs.load("./game_pb.proto", (err, root) => {
    if (err) throw err;
    const rs = root.lookup(cmd[cmdType]);
    const msg = rs.decode(msgBuf);
    console.log(msg);
  });
};

const sendMessage = (ws) => {
  const serviceType = 1;
  const cmdType = 9;
  const message = { userName: "1234", password: "mike" };


  protobufjs.load("./game_pb.proto", (err, root) => {

    if (err) throw err;

    const rs = root.lookupType(cmd[cmdType]);
    const msg = rs.create(message);
    const messageBuf = rs.encode(msg).finish();

    const emptyBuf = Buffer.alloc(4);
    const buf = Buffer.from(emptyBuf);
    buf.writeInt16LE(serviceType, 0);
    buf.writeInt16LE(cmdType, 2);
    const total_len = messageBuf.length + 2 + 2 + 4;
    const bufA = Buffer.concat([buf, emptyBuf, messageBuf], total_len);
    ws.send(bufA);
  });
};
