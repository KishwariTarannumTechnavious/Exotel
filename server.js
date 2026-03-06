const express = require("express");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/incoming-call", (req, res) => {

    const from = (req.body.From || "").replace("+","");
    console.log("Incoming call from:", from);

    let primary = "";
    let fallback = "";

    // INDIA
    if (from.startsWith("91")) {

        primary = "917070632861";   // Mehar
        fallback = "917043200743";  // Kalash

    }

    // USA
    else if (from.startsWith("1")) {

        primary = "919304128815";   // Kishwari
        fallback = "917043200743";  // Kalash

    }

    // OTHER REGION
    else {

        primary = "917070632861";  // Mehar
        fallback = "917207097300"; // Kishwari 2

    }

    const responseXML = `
<Response>
    <Connect timeout="25">
        <Number>${primary}</Number>
        <Number>${fallback}</Number>
    </Connect>
</Response>
`;

    res.set("Content-Type", "text/xml");
    res.send(responseXML);

});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});