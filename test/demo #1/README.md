# Demo #1

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

# Rules when writing

- Header and Message length should be `c3 bf c3 bf c3 bf c3 bf`
- targetURI must be written as `/1/onResult`
- When writing the targetURI length after `c3 bf c3 bf c3 bf c3 bf`, it shouldn't be `/1/onResult` but just `/1`

# Extra info when writing

The length `c3 bf c3 bf c3 bf c3 bf` is an unsigned 32 bit integer, where the max value of this integer type is `4294967295`, `0xFFFFFFFF` in hexadecimal. The value `-1` is also `0xFFFFFFFF` and thus the `Two's Complement` should be applied as you can't write `-1` using this integer type.
