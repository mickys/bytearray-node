package {
	import flash.display.Sprite;
	import flash.events.ProgressEvent;
	import flash.utils.ByteArray;
	import flash.net.Socket;
	
	public class Client extends Sprite {
		public function Client() {
			var socket:Socket = new Socket();
			
			socket.connect("127.0.0.1", 1234);
			
			socket.writeObject({
				message: "The current date is: " + new Date() + " and this message is serialized in AMF3 format."
			});
			
			socket.flush();
		}
	}
}