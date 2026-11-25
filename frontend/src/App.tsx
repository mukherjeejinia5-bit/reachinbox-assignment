import { useState, useEffect } from "react";

function App() {
  const [emails, setEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [startTime, setStartTime] = useState("");
  const [delay, setDelay] = useState("30");
  const [hourlyLimit, setHourlyLimit] = useState("50");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [activeTab, setActiveTab] = useState("compose");
const [emailList, setEmailList] = useState<any[]>([]);
const [loadingEmails, setLoadingEmails] = useState(false);
useEffect(() => {
  if (activeTab === "compose") return;

  const status =
    activeTab === "scheduled" ? "scheduled" : "sent";

  setLoadingEmails(true);

fetch(`https://reachinbox-assignment-w2x8.onrender.com/api/emails?status=${status}`)
    .then((res) => res.json())
    .then((data) => {
      setEmailList(data.emails || []);
    })
    .catch((error) => {
      console.error("Email Fetch Error:", error);
    })
    .finally(() => {
      setLoadingEmails(false);
    });
}, [activeTab]);

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage("Please upload a CSV file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const text = String(e.target?.result || "");

      const foundEmails = text.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      );

      if (foundEmails && foundEmails.length > 0) {
        const uniqueEmails = [...new Set(foundEmails)];
        setEmails(uniqueEmails.join(", "));
        setFileName(file.name);
        setMessage(`${uniqueEmails.length} email addresses found!`);
      } else {
        setMessage("No email addresses found in this CSV file.");
      }
    };

    reader.readAsText(file);
  };

  const scheduleEmail = async () => {
    try {
     const response = await fetch("https://reachinbox-assignment-w2x8.onrender.com/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails,
          subject,
          body,
          startTime,
          delay: Number(delay),
          hourlyLimit: Number(hourlyLimit),
        }),
      });

      const result = await response.json();
      setMessage(result.message);
    } catch {
      setMessage("Backend connection failed!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <h1 className="text-3xl font-bold">ReachInbox</h1>

      <p className="mt-2 text-gray-500">
  Email Scheduling Dashboard
</p>

<a
  href="https://reachinbox-assignment-w2x8.onrender.com/auth/google"
  className="mt-5 inline-block rounded-lg bg-red-600 px-6 py-3 text-white"
>
  Sign in with Google
</a>

<div className="mt-6 flex gap-4">
  <button
    onClick={() => setActiveTab("compose")}
    className={`rounded-lg px-5 py-3 text-white ${
      activeTab === "compose" ? "bg-blue-600" : "bg-gray-400"
    }`}
  >
    Compose Email
  </button>

  <button
    onClick={() => setActiveTab("scheduled")}
    className={`rounded-lg px-5 py-3 text-white ${
      activeTab === "scheduled" ? "bg-blue-600" : "bg-gray-400"
    }`}
  >
    Scheduled Emails
  </button>

  <button
    onClick={() => setActiveTab("sent")}
    className={`rounded-lg px-5 py-3 text-white ${
      activeTab === "sent" ? "bg-blue-600" : "bg-gray-400"
    }`}
  >
    Sent Emails
  </button>
</div>
{activeTab === "compose" && (
<div className="mt-8 rounded-xl bg-white p-6 shadow">
  <h2 className="mb-5 text-xl font-bold">Compose Email</h2>

        <label className="mb-2 block font-semibold">
          Upload CSV File
        </label>

        <input
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          className="mb-3 w-full rounded-lg border p-3"
        />

        {fileName && (
          <p className="mb-3 text-sm text-green-700">
            Uploaded: {fileName}
          </p>
        )}

        <label className="mb-2 block font-semibold">
          Email Addresses
        </label>

        <textarea
          className="mb-4 w-full rounded-lg border p-3"
          placeholder="Email addresses"
          rows={3}
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
        />

        <input
          className="mb-4 w-full rounded-lg border p-3"
          placeholder="Email Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <textarea
          className="mb-4 w-full rounded-lg border p-3"
          placeholder="Email Body"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        <label>Start Time</label>

        <input
          type="datetime-local"
          className="mb-4 mt-2 w-full rounded-lg border p-3"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />

        <label>Delay Between Emails (seconds)</label>

        <input
          type="number"
          className="mb-4 mt-2 w-full rounded-lg border p-3"
          value={delay}
          onChange={(e) => setDelay(e.target.value)}
        />

        <label>Hourly Email Limit</label>

        <input
          type="number"
          className="mb-5 mt-2 w-full rounded-lg border p-3"
          value={hourlyLimit}
          onChange={(e) => setHourlyLimit(e.target.value)}
        />

        <button
          onClick={scheduleEmail}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white"
        >
          Schedule Email
        </button>

                {message && (
          <p className="mt-4 font-semibold text-blue-700">
            {message}
          </p>
        )}
      </div>
)}

{activeTab !== "compose" && (
  <div className="mt-8 rounded-xl bg-white p-6 shadow">
    <h2 className="mb-4 text-xl font-bold">
      {activeTab === "scheduled"
        ? "Scheduled Emails"
        : "Sent Emails"}
    </h2>

    {loadingEmails ? (
      <p>Loading emails...</p>
    ) : emailList.length === 0 ? (
      <p>No emails found.</p>
    ) : (
      <div className="space-y-4">
        {emailList.map((email: any) => (
          <div key={email.id} className="rounded-lg border p-4">
            <p><strong>Email:</strong> {email.email}</p>
            <p><strong>Subject:</strong> {email.subject}</p>
            <p><strong>Status:</strong> {email.status}</p>
          </div>
        ))}
      </div>
    )}
  </div>
)}
    </div>
  );
}

export default App;