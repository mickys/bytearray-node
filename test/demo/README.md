# Demo

This is a small demo, it's the best I can give to detail AMF0 in depth.

The AMF0 packet structure in this demo is as followed:

| Value                 | Type                   |
|-----------------------|------------------------|
| AMF version           | UInt16                 |
| Header count          | UInt16                 |
| Header name           | UTF-8                  |
| Header mustUnderstand | Boolean                |
| Header length         | UInt32 (Only from AS3) |
| Header value          | Object                 |
| Message count         | UInt16                 |
| Message targetURI     | UTF-8                  |
| Message responseURI   | UTF-8                  |
| Message length        | UInt32 (Only from AS3) |
| Message value         | Object                 |

**Rules when writing**

- Header and Message length should be `c3 bf c3 bf c3 bf c3 bf` (Negative unsigned Two's Complement)
- Position should be incremented by `8`
- targetURI must be written as `/1/onResult`
- When writing the targetURI length after `c3 bf c3 bf c3 bf c3 bf`, it shouldn't be `/1/onResult` but just `/1`
