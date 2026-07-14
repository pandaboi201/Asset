const { XMLParser } = require('fast-xml-parser');
const parser = new XMLParser();
const xml = `
<InputProxyChannelList version="1.0" xmlns="http://www.hikvision.com/ver20/XMLSchema" size="16">
    <InputProxyChannel version="1.0" xmlns="http://www.hikvision.com/ver20/XMLSchema">
        <id>1</id>
        <name>1F_EXAMHALL_CAM03</name>
        <sourceInputPortDescriptor>
            <proxyProtocol>HIKVISION</proxyProtocol>
            <addressingFormatType>ipaddress</addressingFormatType>
            <ipAddress>192.168.35.45</ipAddress>
            <managePortNo>8000</managePortNo>
            <srcInputPort>1</srcInputPort>
            <userName>admin</userName>
            <streamType>auto</streamType>
            <model>DS-2CD3141G0-I</model>
            <serialNumber>DS-2CD3141G0-I20210929AAWRG64697573</serialNumber>
            <firmwareVersion>V5.5.122 build 210708</firmwareVersion>
            <deviceID></deviceID>
        </sourceInputPortDescriptor>
    </InputProxyChannel>
</InputProxyChannelList>
`;
console.log(JSON.stringify(parser.parse(xml), null, 2));
