import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const token = req.headers.get("Authorization") || "";
    
    let body;
    try {
      body = await req.json();
      console.log("KIT PUBLISH BODY:", body);
      console.log("TOKEN PRESENT:", !!token);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON body", details: String(e) },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://us-central1-notebook-kit.cloudfunctions.net/kitPublish",
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const text = await response.text();
    console.log("FUNCTION RAW RESPONSE:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: "Invalid JSON from Cloud Function", raw: text, status: response.status };
    }

    return NextResponse.json(data, { status: response.status });

  } catch (err: any) {
    return NextResponse.json(
      { error: "Gateway failure", details: err.message },
      { status: 500 }
    );
  }
}
