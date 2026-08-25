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


// 追加
async function addWork() {

    const work = {

        title: document.getElementById("title").value,
        category: document.getElementById("category").value,
        status: document.getElementById("status").value,
        date: document.getElementById("date").value,
        memo: document.getElementById("memo").value

    };


    try {

        const docRef = await addDoc(
            collection(db, "works"),
            work
        );


        console.log(
            "Firestore保存成功 ID:",
            docRef.id
        );


        works.push({
            id: docRef.id,
            ...work
        });


        displayWorks();


        document.getElementById("title").value = "";
        document.getElementById("category").value = "";
        document.getElementById("status").value = "";
        document.getElementById("date").value = "";
        document.getElementById("memo").value = "";


        checkForm();


    } catch(error) {

        console.error(
            "保存失敗",
            error
        );

    }

}



// 表示
function displayWorks(list = works) {


    const workList =
    document.getElementById("workList");


    workList.innerHTML = "";


    if(list.length === 0){

        workList.innerHTML = `
        <div class="empty">
        <div class="empty-icon">📖</div>
        <p>まだ記録がありません</p>
        </div>
        `;

        return;

    }



    list.forEach(function(work){


        const statusTag =
        work.status
        ? `<span class="status-tag">${work.status}</span>`
        : "";



        workList.innerHTML += `

        <div class="card">

        <h2>${work.title}</h2>

        <div class="tags">

        <span class="category-tag">
        ${work.category}
        </span>

        ${statusTag}

        </div>


        <p>${work.date || ""}</p>


        <p class="memo">
        ${work.memo || ""}
        </p>


        <div class="card-buttons">

        <button onclick="editWork('${work.id}')">
        編集
        </button>


        <button onclick="deleteWork('${work.id}')">
        削除
        </button>


        </div>


        </div>

        `;


    });


}



// Firebase読み込み
async function loadFirebaseWorks(){


    const snapshot =
    await getDocs(
        collection(db,"works")
    );


    works = [];


    snapshot.forEach(function(doc){


        works.push({

            id: doc.id,
            ...doc.data()

        });


    });



    console.log(
        "Firestore読み込み完了",
        works
    );


    displayWorks();


}



// 検索
function searchWorks(){

    const keyword =
    document.getElementById("search")
    .value
    .toLowerCase();


    const result =
    works.filter(function(work){

        return (

        work.title.toLowerCase()
        .includes(keyword)

        ||

        work.category.toLowerCase()
        .includes(keyword)

        ||

        (work.memo || "")
        .toLowerCase()
        .includes(keyword)

        );

    });


    displayWorks(result);

}



// 並び替え
function sortWorks(){

    const type =
    document.getElementById("sort").value;


    let sorted =
    [...works];


    if(type==="new"){

        sorted.sort((a,b)=>{

            if(!a.date) return 1;
            if(!b.date) return -1;

            return new Date(b.date)
            -
            new Date(a.date);

        });

    }


    if(type==="old"){

        sorted.sort((a,b)=>{

            return new Date(a.date)
            -
            new Date(b.date);

        });

    }


    if(type==="name"){

        sorted.sort((a,b)=>
        a.title.localeCompare(b.title)
        );

    }


    displayWorks(sorted);

}



// 編集
function editWork(id){

    const work =
    works.find(
        w=>w.id===id
    );


    document.getElementById("title").value =
    work.title;

    document.getElementById("category").value =
    work.category;

    document.getElementById("status").value =
    work.status || "";

    document.getElementById("date").value =
    work.date || "";

    document.getElementById("memo").value =
    work.memo || "";


    editId=id;


}



// 削除（あとでFirebase対応）
function deleteWork(id){

    works =
    works.filter(
        w=>w.id!==id
    );


    displayWorks();

}



// 設定
function openSettings(){

    document.getElementById("overlay")
    .style.display="block";


    document.getElementById("settingsSheet")
    .classList.add("open");

}


function closeSettings(){

    document.getElementById("overlay")
    .style.display="none";


    document.getElementById("settingsSheet")
    .classList.remove("open");

}



// Firebase

import {
initializeApp
}
from
"https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";


import {

getFirestore,
collection,
addDoc,
getDocs

}
from
"https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";



const firebaseConfig = {

apiKey:"AIzaSyAF7uBhSvDVkuW-7loDhtiOSLZ2ug5bl_c",

authDomain:"mokuro-a9287.firebaseapp.com",

projectId:"mokuro-a9287",

storageBucket:"mokuro-a9287.firebasestorage.app",

messagingSenderId:"130300522379",

appId:"1:130300522379:web:eb4362d67340f2a30c098e"

};



const app =
initializeApp(firebaseConfig);


const db =
getFirestore(app);



console.log("Firebase接続OK");



loadFirebaseWorks();



window.checkForm=checkForm;
window.addWork=addWork;
window.editWork=editWork;
window.deleteWork=deleteWork;
window.searchWorks=searchWorks;
window.sortWorks=sortWorks;
window.openSettings=openSettings;
window.closeSettings=closeSettings;