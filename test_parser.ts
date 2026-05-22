import { XMLParser } from "https://esm.sh/fast-xml-parser@4";

fetch("https://extraordinarywomanblog.com/feed/")
  .then(r => r.text())
  .then(xml => {
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const items = parsed.rss?.channel?.item;
    const item = items.find((i: any) => i.title.includes("APNI"));
    console.log("TITLE:", item.title);
    console.log("KEYS:", Object.keys(item));
    console.log("DESC LENGTH:", item.description.length);
    if (item["content:encoded"]) {
      console.log("CONTENT LENGTH:", item["content:encoded"].length);
    } else {
      console.log("NO CONTENT ENCODED");
    }
  });
