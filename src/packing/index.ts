import e from "express";
import { Unpacker, PackCode, Packer, PackString } from "../constants.js";
import {
  unpackShort,
  unpackByte,
  unpackLong,
  unpackBlob,
  unpackFloat,
  unpackLengthShort,
  unpackStringVar,
  unpackStringFixed,
  packShort,
  packByte,
  packLong,
  packBlob,
  packFloat,
  packBool,
  packLengthShort,
  packStringVar,
  packStringFixed,
} from "./packers.js";
import { unpackBool } from "./unpackers.js";

export const unpackers: Unpacker[] = [
  {
    packCode: "SHORT",
    direction: "inbound",
    packFunction: unpackShort,
  },
  {
    packCode: "BYTE",
    direction: "inbound",
    packFunction: unpackByte,
  },
  {
    packCode: "LONG",
    direction: "inbound",
    packFunction: unpackLong,
  },
  {
    packCode: "BLOB",
    direction: "inbound",
    packFunction: unpackBlob,
  },
  {
    packCode: "FLOAT",
    direction: "inbound",
    packFunction: unpackFloat,
  },
  {
    packCode: "BOOL",
    direction: "inbound",
    packFunction: unpackBool,
  },
  {
    packCode: "LENGTH_SHORT",
    direction: "inbound",
    packFunction: unpackLengthShort,
  },
  {
    packCode: "STRING_VAR",
    direction: "inbound",
    packFunction: unpackStringVar,
  },
  {
    packCode: "STRING_FIXED",
    direction: "inbound",
    packFunction: unpackStringFixed,
  },
];

export const packers: Packer[] = [
  {
    packCode: "SHORT",
    direction: "outbound",
    packFunction: packShort,
  },
  {
    packCode: "BYTE",
    direction: "outbound",
    packFunction: packByte,
  },
  {
    packCode: "LONG",
    direction: "outbound",
    packFunction: packLong,
  },
  {
    packCode: "BLOB",
    direction: "outbound",
    packFunction: packBlob,
  },
  {
    packCode: "FLOAT",
    direction: "outbound",
    packFunction: packFloat,
  },
  {
    packCode: "BOOL",
    direction: "outbound",
    packFunction: packBool,
  },
  {
    packCode: "LENGTH_SHORT",
    direction: "outbound",
    packFunction: packLengthShort,
  },
  {
    packCode: "STRING_VAR",
    direction: "outbound",
    packFunction: packStringVar,
  },
  {
    packCode: "STRING_FIXED",
    direction: "outbound",
    packFunction: packStringFixed,
  },
];

function getDataLength(packCode: PackCode, value: unknown) {
  switch (packCode) {
    case "SHORT":
      return 2;
    case "BYTE":
      return 1;
    case "LONG":
      return 4;
    case "BLOB":
      return (value as Buffer).length;
    case "FLOAT":
      return 4;
    case "BOOL":
      return 1;
    case "LENGTH_SHORT":
      return 2;
    case "STRING_VAR":
      return (value as Buffer).length;
    case "STRING_FIXED":
      return (value as Buffer).length;
  }
  throw new Error(`No data length found for pack code ${packCode}`);
}

export function unpack(packCode: PackString, data: Buffer) {
  let dataOffset = 0;
  let packStringIndex = 0;
  let length;
  let endianness: "LE" | "BE" = "BE";

  // Create a new array of unknowns to store the unpacked data
  const unpackedData: unknown[] = [];

  // Loop through the pack string
  while (packStringIndex < packCode.length) {
    // Get the pack code
    const code = packCode[packStringIndex];

    console.log(`Unpacking ${code} at offset ${dataOffset}, index ${packStringIndex}`);

    // If the code is an endianness code, change the endianness
    if (code === "LE" || code === "BE") {
      endianness = code;
      packStringIndex++;
      continue;
    }

    // If the pack code is a length prefix, get the length
    if (code === "LENGTH_SHORT") {
      length = unpackLengthShort(endianness, data.subarray(dataOffset));

      // Move the offset past the length prefix
      dataOffset += 1;

      // Move the index past the pack code
      packStringIndex++;

      continue;
    }

    // Get the unpacker for this pack code
    const unpacker = unpackers.find((unpacker) => unpacker.packCode === code);

    // If there is no unpacker, throw an error
    if (!unpacker) {
      throw new Error(`No unpacker found for pack code ${code}`);
    }

    // Unpack the data
    const unpacked = unpacker.packFunction(
      endianness,
      data.subarray(dataOffset),
      length
    );

    // If the length was provided, move the offset past the length
    if (length) {
      dataOffset += length;
    }

    console.log(`Adding type ${typeof unpacked} to unpacked data`);

    // Add the unpacked data to the array
    unpackedData.push(unpacked);

    // Reset the length
    length = undefined;

    // Advance the offset past the unpacked data
    dataOffset += getDataLength(code, unpacked);

    console.log(`New offset: ${dataOffset}`);

    // Advance the index past the pack code
    packStringIndex++;

    // If the offset is past the end of the data, break out of the loop
    if (dataOffset > data.length) {
      break;
    }
  }

  // Return the unpacked data
  return unpackedData;
}