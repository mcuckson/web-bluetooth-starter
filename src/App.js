import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [supportsBluetooth, setSupportsBluetooth] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(true);
  const [targetPowerLevel, setTargetPowerLevel] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [cadence, setCadence] = useState(null);
  const [power, setPower] = useState(null);

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
    console.log(event);
    // let dataview = new DataView(event.target.value.buffer);
    // const val = dataview.getUint8(2, dataview, true);
  };

  /**
   * Attempts to connect to a Bluetooth device and subscribe to
   * battery level readings using the battery service.
   */
  const connectToDeviceAndSubscribeToUpdates = async () => {
    /* try { */
    // Search for Bluetooth devices that advertise a battery service
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "KI" }],
      optionalServices: ["00001826-0000-1000-8000-00805f9b34fb"],
      /* optionalServices: ["00001818-0000-1000-8000-00805f9b34fb"], */
      /* filters: [{ services: ["00001826-0000-1000-8000-00805f9b34fb"] }], */
      //{ services: ["battery_service", "cycling_power"] }],
    });

    setIsDisconnected(false);

    // Add an event listener to detect when a device disconnects
    device.addEventListener("gattserverdisconnected", onDisconnected);

    // Try to connect to the remote GATT Server running on the Bluetooth device
    const server = await device.gatt.connect();

    // Get the battery service from the Bluetooth device
    const ids = [
      /* "00001800-0000-1000-8000-00805f9b34fb", */
      /* "00001801-0000-1000-8000-00805f9b34fb", */
      /* "0000180a-0000-1000-8000-00805f9b34fb", */
      /* "00001818-0000-1000-8000-00805f9b34fb", */
      /* "0000181c-0000-1000-8000-00805f9b34fb", */
      "00001826-0000-1000-8000-00805f9b34fb",
      /* "a026ee01-0a7d-4ab3-97fa-f1500f9feb8b", */
      /* "a026ee03-0a7d-4ab3-97fa-f1500f9feb8b", */
      /* "a026ee06-0a7d-4ab3-97fa-f1500f9feb8b", */
      /* "a026ee0b-0a7d-4ab3-97fa-f1500f9feb8b", */
    ];
    console.log("try");
    ids.forEach(async (i) => {
      const all = await server.getPrimaryServices(i);
      console.log(all);
    });
    console.log("done");

    const service = await server.getPrimaryService(
      "00001826-0000-1000-8000-00805f9b34fb"
    );
    console.log("continuing");
    /* const chars = await service.getCharacteristics(); */
    /* console.log(chars); */

    // Get the Cycling Power Control Point characteristic from the Bluetooth device
    const characteristic = await service.getCharacteristic(
      "00002ad9-0000-1000-8000-00805f9b34fb"
    );

    // get the 'Indoor Bike Data' characteristic which contains the features the device exposes
    const characteristicIndoorBikeData = await service.getCharacteristic(
      "00002ad2-0000-1000-8000-00805f9b34fb"
    );
    await characteristicIndoorBikeData.startNotifications();
    characteristicIndoorBikeData.addEventListener(
      "characteristicvaluechanged",
      (event) => {
        console.log(event);
        let dataview = new DataView(event.target.value.buffer);
        let flags = dataview.getUint16(0, true);
        var i;
        for (i = 0; i < 16; i++) {
          console.log("flags[" + i + "] = " + !!((flags >>> i) & 1));
        }
        // console.log('Instantaneous Speed = ' + dataview.getUint16(2, true) / 100)
        // console.log('Instantaneous Cadence = ' + dataview.getUint16(4, true) * 0.5)
        // console.log('Instantaneous Power  = ' + dataview.getInt16(6, true))

        setSpeed(dataview.getUint16(2, true) / 100);
        setCadence(dataview.getUint16(4, true) * 0.5);
        setPower(dataview.getInt16(6, true));
        //THIS MIGHT WORK ON A REAL BIKE - BUT NOT ON SIMULATOR console.log('Heart Rate  = ' + dataview.getUint8(8, true))
      }
    );

    ////////////////////

    function requestControl() {
      const OpCode = 0x00;
      let buffer = new ArrayBuffer(1);
      let view = new DataView(buffer);
      view.setUint8(0, OpCode, true);

      return view;
    }

    function powerTarget(args) {
      const OpCode = 0x05;
      const power = args.power;

      const buffer = new ArrayBuffer(3);
      const view = new DataView(buffer);
      view.setUint8(0, OpCode, true);
      view.setUint16(1, power, true);

      return view;
    }

    await characteristic.startNotifications();
    characteristic.addEventListener(
      "characteristicvaluechanged",
      handleCharacteristicValueChanged
    );

    await characteristic.writeValue(requestControl());

    let power = 100;
    setTargetPowerLevel(power);
    await characteristic.writeValue(powerTarget({ power }));

    setInterval(async function () {
      if (power === 100) {
        power = 200;
      } else {
        power = 250;
      }
      setTargetPowerLevel(power);
      await characteristic.writeValue(powerTarget({ power }));
    }, 15000);
  };

  return (
    <div className="App">
      <h1>Bike Trainer & Heart Rate App</h1>
      {supportsBluetooth && !isDisconnected && (
        <p>Target Power Level: {targetPowerLevel}</p>
      )}
      {supportsBluetooth && !isDisconnected && (
        <table>
          <tr>
            <th>Speed</th>
            <th>Cadence</th>
            <th>Power</th>
          </tr>
          <tr>
            <td>{speed}</td>
            <td>{cadence}</td>
            <td>{power}</td>
          </tr>
        </table>
      )}

      {supportsBluetooth && isDisconnected && (
        <button
          className="button"
          onClick={connectToDeviceAndSubscribeToUpdates}
        >
          Connect - Bike Trainer
        </button>
      )}
      {!supportsBluetooth && (
        <p>This browser doesn't support the Web Bluetooth API</p>
      )}
    </div>
  );
}

export default App;
