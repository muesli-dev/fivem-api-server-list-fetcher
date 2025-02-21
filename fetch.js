// go to the function to change your filters for the serverlist / single server
// async function start ()
// 


var $protobuf = require("protobufjs");
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

class FrameReader {
  lastArray = null

  frameLength = -1

  framePos = 0

  constructor(stream, onFrame, onEnd) {
    this.stream = stream
	this.reader = stream.getReader()
    this.onFrame = onFrame
	this.onEnd = onEnd
  }

  read() {
    this.doRead()
  }

  async doRead() {
    const { done, value } = await this.reader.read()

    if (done || !value) {
		this.onEnd()
      return
    }

    let array = value

    while (array.length > 0) {
      const start = 4

      if (this.lastArray) {
        const newArray = new Uint8Array(array.length + this.lastArray.length)
        newArray.set(this.lastArray)
        newArray.set(array, this.lastArray.length)

        this.lastArray = null

        array = newArray
      }

      if (this.frameLength < 0) {
        if (array.length < 4) {
          this.lastArray = array
          this.doRead()

          return
        }

        this.frameLength =
          array[0] | (array[1] << 8) | (array[2] << 16) | (array[3] << 24)

        if (this.frameLength > 65535) {
          throw new Error("A too large frame was passed.")
        }
      }

      const end = 4 + this.frameLength - this.framePos

      if (array.length < end) {
        this.lastArray = array
        this.doRead()

        return
      }

      const frame = softSlice(array, start, end)
      this.framePos += end - start

      if (this.framePos === this.frameLength) {
        // reset
        this.frameLength = -1
        this.framePos = 0
      }

      this.onFrame(frame)

      // more in the array?
      if (array.length > end) {
        array = softSlice(array, end)
      } else {
        // continue reading
        this.doRead()

        return
      }
    }
  }
}

function softSlice(arr, start, end) {
  return new Uint8Array(arr.buffer, arr.byteOffset + start, end && end - start)
}

function decodeServer(reader, length) {
  if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
  var end = length === undefined ? reader.len : reader.pos + length,
    message = {},
    key,
    value
  while (reader.pos < end) {
    var tag = reader.uint32()
    switch (tag >>> 3) {
      case 1:
        message.svMaxclients = reader.int32()
        break
      case 2:
        message.clients = reader.int32()
        break
      case 3:
        message.protocol = reader.int32()
        break
      case 4:
        message.hostname = reader.string()
        break
      case 5:
        message.gametype = reader.string()
        break
      case 6:
        message.mapname = reader.string()
        break
      case 8:
        if (!(message.resources && message.resources.length))
          message.resources = []
        message.resources.push(reader.string())
        break
      case 9:
        message.server = reader.string()
        break
      case 10:
        break
      case 11:
        message.iconVersion = reader.int32()
        break
      case 16:
        message.enhancedHostSupport = reader.bool()
        break
      case 17:
        message.upvotePower = reader.int32()
        break
      case 19:
        message.burstPower = reader.int32()
        break
      default:
        reader.skipType(tag & 7)
        break
    }
  }
  return message
}


function decode(reader, length) {
  if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
  var end = length === undefined ? reader.len : reader.pos + length,
    message = {}
  while (reader.pos < end) {
    var tag = reader.uint32()
    switch (tag >>> 3) {
      case 1:
        message.EndPoint = reader.string()
        break
      case 2:
        message.Data = decodeServer(reader, reader.uint32())
        break
      default:
        reader.skipType(tag & 7)
        break
    }
  }
  return message
}

async function fetchingSingle(str) {
	const res = await fetch("https://servers-frontend.fivem.net/api/servers/single/" + str, {
  "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "de,de-DE;q=0.9,en-US;q=0.8,en;q=0.7",
    "cache-control": "max-age=0",
    "priority": "u=0, i",
    "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1"
  },
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});

return await res.json();
}


async function start () {
	

const { body } = await fetch("https://servers-frontend.fivem.net/api/servers/stream/", {
  "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "de,de-DE;q=0.9,en-US;q=0.8,en;q=0.7",
    "priority": "u=0, i",
    "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1"
  },
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
})


async function getSingle(srv) {
	return await fetchingSingle(srv.EndPoint)
}

const servers = [];

const frameReader = new FrameReader(
  body,
  async frame => {
    const srv = decode(frame)
	// add your filters here
    if (srv.EndPoint && srv.Data && srv.Data.hostname && (srv.Data.hostname.toLowerCase().includes('deutsch') || srv.Data.hostname.toLowerCase().includes('german') || srv.Data.hostname.toLowerCase().includes('keine'))) {
	  servers.push(srv)
    }
  },
  async () => {
	  console.log('got full server list now sorting')
	  for (let a of servers){
		  const s = await getSingle(a)
		  
		  // add resources filerts or diffrent single server filters
		  if (s.resources && s.resources.filter(x => x.includes('multicharacter'))){
			  console.log(s.resources)
			  return;
		  }
		  
		  
		  await new Promise(resolve => setTimeout(resolve, 1000));
	  }
		//
		//
  }
)

frameReader.read()
	
}

start()






