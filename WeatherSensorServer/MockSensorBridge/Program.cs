using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace MockSensorBridge
{
    class Program
    {
        public const int SendPeriodMs = 5000;

        private static TcpListener _listener;
        private static List<Thread> _activeServers = new List<Thread>();

        static void Main(string[] args)
        {
            IPEndPoint localEp = new IPEndPoint(IPAddress.Loopback, 3001);
            _listener = new TcpListener(localEp);
            _listener.Start();

            Console.WriteLine("Waiting for connections...");

            SensorData exampleData = GenerateMockData(0);
            Console.WriteLine($"Data example: {DecToString(exampleData.ToByteArray(0))}");

            while (true)
            {
                TcpClient client = _listener.AcceptTcpClient();
                Console.WriteLine($"Client connected: {client.Client.RemoteEndPoint}");
                Thread serverThread = new Thread(ServeClient);
                serverThread.Start(client);
                lock (_activeServers)
                {
                    _activeServers.Add(serverThread);
                }
            }
        }

        static SensorData GenerateMockData(int number)
        {
            SensorData sensorData = new SensorData()
            {
                HumidityRaw = (ushort)(600 + number),
                PressureRaw = 101000 + number * 100,
                TemperatureRaw = (ushort)(250 + number)
            };
            return sensorData;
        }

        static string DecToString(byte[] array)
        {
            StringBuilder builder = new StringBuilder();

            foreach (var el in array)
            {
                string value = el.ToString("D");
                builder.Append(value).Append(", ");
            }

            return builder.ToString();
        }

		static void ServeClient(object tcpClient)
        {
            TcpClient client = (TcpClient) tcpClient;
            EndPoint ep = client.Client.RemoteEndPoint;

            NetworkStream stream = client.GetStream();
            int number = 0;
            while (client.Connected && stream.CanWrite)
            {
                byte[] data = GenerateMockData(number++).ToByteArray(0);
                try
                {
                    Console.WriteLine($"Sending data. Destination: {ep}, Data: {DecToString(data)}");
                    stream.Write(data, 0, data.Length);
                    Thread.Sleep(SendPeriodMs);
                }
                catch(IOException ex)
                {
                    Console.WriteLine("Exception occured: " + ex.Message);
                }
            }

            lock (_activeServers)
            {
                _activeServers.Remove(Thread.CurrentThread);
            }

            Console.WriteLine($"Client disconnected: {ep}");
        }
    }
}
