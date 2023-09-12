const url = window.location.href;

const match1 = url.match(/contest\/(\d+)/);
const match2 = url.match(/problemset\/problem\/(\d+)/);
var contestNumber = null

if (match1) contestNumber = match1[1];
else if (match2) contestNumber = match2[1];
else contestNumber = -1

var reqURL = "";
const requestURL = `https://codeforces.com/api/contest.standings?contestId=${contestNumber}&from=1&count=1`;
var requestURL2 = "";
chrome.storage.local.get(['userHandle'], function (result) {
    if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
    } else {
        var userHandle = result.userHandle;
        requestURL2 = `https://codeforces.com/api/contest.status?contestId=${contestNumber}&handle=${userHandle}`;
        reqURL = `https://codeforces.com/api/user.info?handles=${userHandle}`;

    }
});

var userRating;
var flag = 0;
const upsolveIndexes = [];
fetchData();
async function fetchData() {
    const Verdict = {
        AC: "rgb(64, 255, 64)",
        WA: "rgb(255, 0, 0)",
        NA: "#0d9aff",
    };
    const problems = [], verdicts = {};
    try {
        const response = await fetch(requestURL);
        const data = await response.json();
        const problemsList = data.result.problems;
        const response2 = await fetch(requestURL2);
        const data2 = await response2.json();
        const res = await fetch(reqURL);
        const data3 = await res.json();
        if (data3.status == "OK") {
            userRating = data3.result[0].rating;
        }
        if (data2.status === "OK") {
            const res = data2.result;
            for (var i = 0; i < res.length; i++) {
                const index = res[i].problem.index;
                const curVerdict = (res[i].verdict == "OK" ? Verdict["AC"] : Verdict["WA"]);
                if (!(index in verdicts) || (index in verdicts && verdicts[index] != Verdict["AC"])) verdicts[index] = curVerdict;
            }
        }
        if (data.status == "OK") {
            for (var i = 0; i < problemsList.length; i++) {
                const index = problemsList[i].index;
                const title = index + " - " + problemsList[i].name;
                const rating = problemsList[i].rating;
                if (rating >= userRating + 300 && flag == 0) {
                    upsolveIndexes.push(index); flag = 1;
                }
                const verdict = (index in verdicts ? verdicts[index] : Verdict["NA"])
                const problemUrl = `https://codeforces.com/contest/${contestNumber}/problem/${index}`;
                problems.push({ index: index, url: problemUrl, title: title, rating: rating, verdict: verdict });
            }
        }

    }
    catch (e) {
    }
    var toInsert;
    if (problems) {
        toInsert = `
    <div class="roundbox sidebox" style="background-color: #f4f4f4; border: 1px solid #ddd; box-shadow: 0 0 5px rgba(0, 0, 0, 0.2); padding: 10px;">
        <div class="roundbox-lt">&nbsp;</div>
        <div class="roundbox-rt">&nbsp;</div>
        <div class="caption titled">→ Contest Problems
            <i class="sidebar-caption-icon las la-angle-down" onclick="
                if (this.classList.contains('la-angle-right')) {
                    document.getElementById('Tagblock').style.display = 'block';
                    this.classList.add('la-angle-down');
                    this.classList.remove('la-angle-right');
                } else {
                    document.getElementById('Tagblock').style.display = 'none';
                    this.classList.add('la-angle-right');
                    this.classList.remove('la-angle-down');
                }">
            </i>
            <div class="top-links"></div>
        </div>
        <div id="Tagblock" style="display: block; text-align: left;">
            <div style="display: flex; flex-direction: column; align-items: left;">
    `;

        problems.forEach(e => {
            toInsert += `
        <div style=" margin: 2px; text-align: left; padding-left: 2vw; box-sizing: border-box;">
            <a title="${e.title}" href="${e.url}" style="color:${e.verdict}; text-decoration: none;">${e.title}</a>
            ${e.rating == null ? '-' : e.rating}
        </div>
        `
        });


        toInsert += '</div></div>'
    }

    toInsert += `
<div id="upsolveElement" style=" text-align: left; font-family: 'Ubuntu', sans-serif; padding-left: 2vw; margin-top: 10px;" class="fixed-bottom">
    Try Upsolving upto(rating + 300) Problem: ${upsolveIndexes.join(", ")}
</div>
`;

    const getProblemBox = document.createElement("div");
    getProblemBox.innerHTML = toInsert;
    document.querySelector("#sidebar").prepend(getProblemBox);
}
