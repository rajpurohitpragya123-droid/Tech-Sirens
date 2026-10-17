// Reference LOW-VOLTAGE relay controller only. Not commissioned production firmware.
// Provision credentials and the broker CA through an ignored secrets.h in src/.
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include "secrets.h"
constexpr int RELAY_PIN=26; // Active-HIGH reference relay; verify polarity before installation.
constexpr unsigned long HARD_MAX_MS=45UL*60UL*1000UL;
constexpr unsigned long WATCHDOG_MS=60UL*1000UL;
WiFiClientSecure network;PubSubClient mqtt(network);
bool valve=false;unsigned long started=0,lastCommand=0;
void off(){digitalWrite(RELAY_PIN,LOW);valve=false;}
void command(char* topic,byte* payload,unsigned int length){
 JsonDocument doc;if(deserializeJson(doc,payload,length))return;
 String id=doc["commandId"]|"";String action=doc["command"]|"OFF";
 if(id.length()==0)return;
 // Epoch time must be synced before ON; expired commands never actuate a relay.
 uint64_t expiry=doc["expiresAt"]|0ULL;uint64_t epoch=(uint64_t)time(nullptr)*1000ULL;
 if(action=="OFF"){off();}
 else if(action=="ON"&&epoch>1700000000000ULL&&expiry>epoch&&expiry-epoch<=60000ULL){
  if(!valve){started=millis();valve=true;digitalWrite(RELAY_PIN,HIGH);}lastCommand=millis();
 }else return;
 JsonDocument ack;ack["commandId"]=id;ack["valve"]=valve?"ON":"OFF";
 String body;serializeJson(ack,body);mqtt.publish(ACK_TOPIC,body.c_str(),false);
}
void setup(){pinMode(RELAY_PIN,OUTPUT);off();Serial.begin(115200);WiFi.begin(WIFI_SSID,WIFI_PASSWORD);network.setCACert(BROKER_CA);mqtt.setServer(MQTT_HOST,8883);mqtt.setCallback(command);configTime(0,0,"pool.ntp.org");}
void loop(){
 if(WiFi.status()!=WL_CONNECTED||!mqtt.connected()){off();if(WiFi.status()==WL_CONNECTED&&mqtt.connect(DEVICE_ID,MQTT_USERNAME,MQTT_PASSWORD)){mqtt.subscribe(COMMAND_TOPIC,1);}delay(500);return;}
 mqtt.loop();if(valve&&(millis()-started>=HARD_MAX_MS||millis()-lastCommand>=WATCHDOG_MS))off();delay(20);
}
