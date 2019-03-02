package com {
	import flash.display.Sprite;
	import flash.net.NetConnection;
	import flash.net.Responder;
	
	public class Main extends Sprite {
		public function Main() {
			var connection:NetConnection = new NetConnection();
			var responder:Responder = new Responder(onResponse, onFault);
			
			connection.objectEncoding = 0;
			connection.connect("http://127.0.0.1:8081/");
			
			connection.addHeader("ping", false, {test: "OK"});
			connection.call("ping", responder, "Ping!");
		}
		
		private function onResponse(data:Object):void {
			trace("Received: " + data);
		}

		private function onFault(fault:Object):void {
			trace(fault as String);
		}
	}
}