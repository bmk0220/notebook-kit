import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const token = req.headers.get("Authorization");
  const body = await req.json();

  const response = await fetch(
    "https://us-central1-notebook-kit.cloudfunctions.net/kitPublish",
    {
      method: "POST",
      headers: {
        Authorization: token || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
