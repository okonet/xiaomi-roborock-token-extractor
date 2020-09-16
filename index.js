const path = require("path");
const bt = require("ibackuptool");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const aesjs = require("aes-js");

async function main() {
	const backups = await bt.run("backups.list");
	const { udid } = backups[0];
	const files = await bt.run("backup.files", {
		backup: udid,
		filter: "mihome.sqlite",
		extract: path.resolve("."),
	});
	const dbFile = files
		.filter((file) => file.domain === "AppDomain-com.xiaomi.mihome")
		.find((file) => file.path.endsWith("mihome.sqlite"));
	const dbFilePath = path.join(".", dbFile.domain, dbFile.path);
	const db = await open({
		filename: dbFilePath,
		driver: sqlite3.Database,
	});
	const tokens = await db.all(
		"SELECT ZTOKEN,ZMODEL,ZMAC,ZNAME,ZLOCALIP FROM ZDEVICE WHERE ZMODEL LIKE '%roborock.vacuum%'"
	);
	console.log(tokens);
	const key = Array(16).fill(0x0);
	tokens.forEach((token) => {
		let decrypted = new aesjs.ModeOfOperation.ecb(key).decrypt(
			aesjs.utils.hex.toBytes(token.ZTOKEN)
		);

		decrypted = aesjs.utils.utf8.fromBytes(decrypted).slice(0, 32);
		console.log("Decryipted token: %s", decrypted);
	});
}

main();
