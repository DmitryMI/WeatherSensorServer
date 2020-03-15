using System;

namespace MockSensorBridge
{
    public struct SensorData
    {
        public UInt16 TemperatureRaw { get; set; }
        public UInt16 HumidityRaw { get; set; }

        public Int32 PressureRaw { get; set; }

        public byte[] ToByteArray(byte channelId)
        {
            byte[] result = new byte[1 + sizeof(UInt16) + sizeof(UInt16) + sizeof(UInt32)];

            byte[] t = BitConverter.GetBytes(TemperatureRaw);
            byte[] h = BitConverter.GetBytes(HumidityRaw);
            byte[] p = BitConverter.GetBytes(PressureRaw);

            result[0] = channelId;
            int pos = 1;
            Array.Copy(t, 0, result, pos, t.Length);
            pos += t.Length;
            Array.Copy(h, 0, result, pos, h.Length);
            pos += h.Length;
            Array.Copy(p, 0, result, pos, p.Length);
            pos += p.Length;

            return result;
        }
    }
}