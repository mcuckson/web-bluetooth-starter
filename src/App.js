import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [supportsBluetooth, setSupportsBluetooth] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(null);

  // When the component mounts, check that the browser supports Bluetooth
  useEffect(() => {
    if (navigator.bluetooth) {
      setSupportsBluetooth(true);
    }
  }, []);

  /**
   * Let the user know when their device has been disconnected.
   */
  const onDisconnected = (event) => {
    alert(`The device ${event.target} is disconnected`);
    setIsDisconnected(true);
  };

  /**
   * Update the value shown on the web page when a notification is
   * received.
   */
  const handleCharacteristicValueChanged = (event) => {
    let dataview = new DataView(event.target.value.buffer);
    const val = dataview.getUint16(2, dataview, true);
    setBatteryLevel(val);
  };

  /**
   * Attempts to connect to a Bluetooth device and subscribe to
   * battery level readings using the battery service.
   */
  const connectToDeviceAndSubscribeToUpdates = async () => {
    /* try { */
    // Search for Bluetooth devices that advertise a battery service
    const device = await navigator.bluetooth.requestDevice({
      /* filters: [{ namePrefix: "KI" }], */
      /* optionalServices: ["00001818-0000-1000-8000-00805f9b34fb"], */
      filters: [{ services: ["00001818-0000-1000-8000-00805f9b34fb"] }],
      //{ services: ["battery_service", "cycling_power"] }],
    });

    setIsDisconnected(false);

    // Add an event listener to detect when a device disconnects
    device.addEventListener("gattserverdisconnected", onDisconnected);

    // Try to connect to the remote GATT Server running on the Bluetooth device
    const server = await device.gatt.connect();

    // Get the battery service from the Bluetooth device
    const service = await server.getPrimaryService(
      "00001818-0000-1000-8000-00805f9b34fb"
    );
    /* const chars = await service.getCharacteristics(); */
    /* console.log(chars); */

    // Get the battery level characteristic from the Bluetooth device
    const characteristic = await service.getCharacteristic(
      "00002a63-0000-1000-8000-00805f9b34fb"
    );

    // Subscribe to battery level notifications
    characteristic.startNotifications();

    // When the battery level changes, call a function
    characteristic.addEventListener(
      "characteristicvaluechanged",
      handleCharacteristicValueChanged
    );

    // Read the battery level value
    /* const reading = await characteristic.readValue(); */
    /* console.log(reading); */

    // Show the initial reading on the web page
    /* setBatteryLevel(reading.getUint8(0) + "%"); */
    /* } catch (error) { */
    /* console.log(`There was an error: ${error}`); */
    /* } */
  };

  return (
    <div className="App">
      <h1>Get Device Battery Info Over Bluetooth</h1>
      {supportsBluetooth && !isDisconnected && (
        <p>Battery level: {batteryLevel}</p>
      )}
      {supportsBluetooth && isDisconnected && (
        <button onClick={connectToDeviceAndSubscribeToUpdates}>
          Connect to a Bluetooth device
        </button>
      )}
      {!supportsBluetooth && (
        <p>This browser doesn't support the Web Bluetooth API</p>
      )}
    </div>
  );
}

export default App;
