import cron from "node-cron"

cron.schedule("* * * * *", async () => {
    await fetch("http://localhost:1001/api/cron/process-campaigns", {
        method: "POST",
        headers: {
            Authorization: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZjljMTVmNTU2ZGYxZjgyamFhYjY5MWUiLCJlbWFpbCI6Imx1Y2t5LmN1c3RvbWVyQGV4YW1wbGUuY29tIiwidHlwZSI6InN1YnNjcmliZXIiLCJpYXQiOjE3NDgwNTc1MDQsImV4cCI6MTc0ODA1NzcwNH0.J5-X5kXh0TjB0vFw4l0d3-q3l4f9Q1g8Q4v8B5x9O6Y",
        },
    })

    console.log("Cron triggered")
})      