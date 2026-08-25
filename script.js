let works = [];
let editId = null;


// 追加ボタン制御
function checkForm() {

    const title = document.getElementById("title").value;
    const category = document.getElementById("category").value;
    const button = document.getElementById("addButton");

    button.disabled = (
        title.trim() === "" ||
        category === ""
    );

}


// 追加・編集
async function addWork() {

    

    const work = {
        title: title,
        category: category,
        status: status,
        date: date,
        memo: memo
    };


    try {

       const docRef = await addDoc(collection(db, "works"), work);

console.log("Firestore保存成功 ID:", docRef.id);


        // 表示用のローカルデータにも追加
        works.push({
            id: Date.now(),
            ...work
        });


        displayWorks();


        document.getElementById("title").value = "";
        document.getElementById("category").value = "";
        document.getElementById("date").value = "";
        document.getElementById("memo").value = "";
        document.getElementById("status").value = "";


        checkForm();


    } catch(error) {

        console.error("保存失敗", error);
        alert("保存に失敗しました");

    }

}

       
       

    


    


    document.getElementById("title").value = "";
    document.getElementById("category").value = "";
    document.getElementById("date").value = "";
    document.getElementById("memo").value = "";
    document.getElementById("status").value = "";


    checkForm();




// 保存
function saveWorks() {

    localStorage.setItem(
        "works",
        JSON.stringify(works)
    );

}



// 表示
function displayWorks(list = works) {

    const workList = document.getElementById("workList");

    workList.innerHTML = "";

    // データが0件のとき
    if (list.length === 0) {

        workList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">📖</div>
                <p>

まだ記録がありません

触れた作品を追加すると、
ここに目録が並びます</p>
            </div>
        `;

        return;
    }

    list.forEach(function(work) {

        const statusTag = work.status
    ? `<span class="status-tag">${work.status}</span>`
    : "";

        const card = `
<div class="card">

    <h2>${work.title}</h2>

    <div class="tags">
        <span class="category-tag">${work.category}</span>
        ${statusTag}
    </div>

    <p>${work.date || ""}</p>

    <p class="memo">${work.memo || ""}</p>

    <div class="card-buttons">
        <button onclick="editWork(${work.id})">
            編集
        </button>

        <button onclick="deleteWork(${work.id})">
            削除
        </button>
    </div>

</div>
`;

        workList.innerHTML += card;

    });

}


// 削除
function deleteWork(id) {

    works = works.filter(function(work) {

        return work.id !== id;

    });


    saveWorks();

    displayWorks();

}


// 編集
function editWork(id) {

    const work = works.find(function(work) {

        return work.id === id;

    });


    document.getElementById("title").value = work.title;
    document.getElementById("category").value = work.category;
    document.getElementById("status").value = work.status || "";
    document.getElementById("date").value = work.date;
    document.getElementById("memo").value = work.memo;


    editId = id;

    checkForm();

}


// 検索
function searchWorks() {

    const keyword =
    document.getElementById("search")
    .value
    .toLowerCase();


    const filteredWorks = works.filter(function(work) {

        return (
            work.title.toLowerCase().includes(keyword) ||
            work.category.toLowerCase().includes(keyword) ||
            (work.memo || "").toLowerCase().includes(keyword)
        );

    });


    displayWorks(filteredWorks);

}


// カテゴリー絞り込み
function filterWorks() {

    const category =
    document.getElementById("filterCategory").value;


    const filteredWorks = works.filter(function(work) {

        if(category === "") {
            return true;
        }

        return work.category === category;

    });


    displayWorks(filteredWorks);

}


// 並び替え
function sortWorks() {

    const sortType = document.getElementById("sort").value;

    let sortedWorks = [...works];


    if (sortType === "new") {

        sortedWorks.sort(function(a,b){

            return new Date(b.date) - new Date(a.date);

        });

    }


    if (sortType === "old") {

        sortedWorks.sort(function(a,b){

            return new Date(a.date) - new Date(b.date);

        });

    }


    if (sortType === "name") {

        sortedWorks.sort(function(a,b){

            return a.title.localeCompare(b.title);

        });

    }


    displayWorks(sortedWorks);

}

// JSON書き出し
function exportWorks() {

    const data = JSON.stringify(works, null, 2);

    const blob = new Blob(
        [data],
        {type:"application/json"}
    );


    const url = URL.createObjectURL(blob);


    const a = document.createElement("a");

    a.href = url;
    a.download = "mokuro-backup.json";

    a.click();


    URL.revokeObjectURL(url);

}
 // JSON読み込みボタン
function importWorks() {

    document
        .getElementById("importFile")
        .click();

}


// JSON読み込み処理
function loadWorks(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }


    const reader = new FileReader();


    reader.onload = function(e) {

        try {

            const data = JSON.parse(e.target.result);


            if (!Array.isArray(data)) {

                alert("正しいデータではありません");
                return;

            }


            works = data;

            saveWorks();

            displayWorks();


            alert("データを読み込みました");


        } catch(error) {

            alert("読み込みに失敗しました");

        }

    };


    reader.readAsText(file);

}

//設定
// 設定シート

function openSettings(){

    document
        .getElementById("overlay")
        .style.display = "block";

    document
        .getElementById("settingsSheet")
        .classList.add("open");

}


function closeSettings(){

    document
        .getElementById("overlay")
        .style.display = "none";

    document
        .getElementById("settingsSheet")
        .classList.remove("open");

}
if ("serviceWorker" in navigator) {

    navigator.serviceWorker.register("./service-worker.js");

}


// Firebase読み込み

import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import { 
    getFirestore,
    collection,
    addDoc,
    getDocs
} 
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyAF7uBhSvDVkuW-7loDhtiOSLZ2ug5bl_c",
    authDomain: "mokuro-a9287.firebaseapp.com",
    projectId: "mokuro-a9287",
    storageBucket: "mokuro-a9287.firebasestorage.app",
    messagingSenderId: "130300522379",
    appId: "1:130300522379:web:eb4362d67340f2a30c098e"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
async function migrateLocalWorks(){

    const localWorks = JSON.parse(localStorage.getItem("works")) || [];

    console.log("移行対象", localWorks);

    for (const work of localWorks){

        await addDoc(collection(db, "works"), {
            title: work.title,
            category: work.category,
            status: work.status || "",
            date: work.date || "",
            memo: work.memo || ""
        });

    }

    console.log("移行完了");
}

window.migrateLocalWorks = migrateLocalWorks;


console.log("Firebase接続OK ver2");



async function loadFirebaseWorks(){

    const snapshot = await getDocs(
        collection(db, "works")
    );

    works = [];

    snapshot.forEach(function(doc){

        works.push({
            id: doc.id,
            ...doc.data()
        });

    });

    console.log("Firestore読み込み完了", works);

    displayWorks();

}


loadFirebaseWorks();

window.checkForm = checkForm;
window.addWork = addWork;
window.displayWorks = displayWorks;
window.searchWorks = searchWorks;
window.filterWorks = filterWorks;
window.sortWorks = sortWorks;
window.editWork = editWork;
window.deleteWork = deleteWork;
window.exportWorks = exportWorks;
window.importWorks = importWorks;
window.loadWorks = loadWorks;
window.openSettings = openSettings;
window.closeSettings = closeSettings;


