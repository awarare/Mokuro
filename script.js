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


        // 編集の場合
        if(editId){

            await updateDoc(
                doc(db,"works",editId),
                work
            );


            works = works.map(function(item){

                if(item.id === editId){

                    return {
                        id: editId,
                        ...work
                    };

                }

                return item;

            });


            console.log("Firestore更新成功");


            editId = null;

            document.getElementById("addButton").textContent = "追加";
            document.getElementById("cancelButton").style.display = "none";

        }


        // 新規追加の場合
        else{


            const docRef = await addDoc(
                collection(db,"works"),
                work
            );


            works.push({

    id:docRef.id,
    ...work

});

sortWorksByDate();

            console.log(
                "Firestore保存成功 ID:",
                docRef.id
            );

        }


        displayWorks();


        document.getElementById("title").value="";
        document.getElementById("category").value="";
        document.getElementById("status").value="";
        document.getElementById("date").value="";
        document.getElementById("memo").value="";


        checkForm();


    }catch(error){

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

    const snapshot = await getDocs(
        collection(db,"works")
    );

    works = [];

    snapshot.forEach(function(doc){

        works.push({
            id: doc.id,
            ...doc.data()
        });

    });

    sortWorksByDate();

    displayWorks();

}

//起動時新しい順でソート
function sortWorksByDate(){

    works.sort(function(a,b){

        if(!a.date && !b.date){
            return 0;
        }

        if(!a.date){
            return 1;
        }

        if(!b.date){
            return -1;
        }

        return new Date(b.date) - new Date(a.date);

    });

}

//追加時も
sortWorksByDate();

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
//絞り込み関数
function updateList(){

    const keyword =
    document.getElementById("search").value.toLowerCase();

    const category =
    document.getElementById("filterCategory").value;


    const result = works.filter(function(work){

        const matchKeyword =
        work.title.toLowerCase().includes(keyword) ||
        (work.memo || "").toLowerCase().includes(keyword);


        const matchCategory =
        category === "" ||
        work.category === category;


        return matchKeyword && matchCategory;

    });


    displayWorks(result);

}

// 並び替え
function sortWorks(){

    const type =
    document.getElementById("sort").value;


    let sorted = [...works];


    if(type === "new"){

        sorted.sort(function(a,b){

            if(!a.date){
                return 1;
            }

            if(!b.date){
                return -1;
            }


            return new Date(b.date)
            -
            new Date(a.date);

        });

    }


    if(type === "old"){

        sorted.sort(function(a,b){

            if(!a.date){
                return 1;
            }

            if(!b.date){
                return -1;
            }


            return new Date(a.date)
            -
            new Date(b.date);

        });

    }


    if(type === "name"){

        sorted.sort(function(a,b){

            return a.title.localeCompare(
                b.title,
                "ja"
            );

        });

    }


    displayWorks(sorted);

}



//編集
function editWork(id){

    console.log("編集開始", id);

    const work = works.find(
        w => w.id === id
    );

    if(!work){
        return;
    }

    document.getElementById("title").value = work.title;
    document.getElementById("category").value = work.category;
    document.getElementById("status").value = work.status || "";
    document.getElementById("date").value = work.date || "";
    document.getElementById("memo").value = work.memo || "";

    editId = id;

    document.getElementById("addButton").textContent = "更新";

    document.getElementById("cancelButton").style.display = "inline-block";

    document.querySelector("#addForm h2").textContent = "作品を編集";

    // ★編集フォームを開く
    document.getElementById("addForm").classList.add("open");

    checkForm();
    document.getElementById("addForm").scrollIntoView({
    behavior:"smooth"
    
});
}



//キャンセル
function cancelEdit(){

    editId = null;

    document.getElementById("title").value = "";
    document.getElementById("category").value = "";
    document.getElementById("status").value = "";
    document.getElementById("date").value = "";
    document.getElementById("memo").value = "";

    document.getElementById("addButton").textContent = "追加";

    document.getElementById("cancelButton").style.display = "none";
    document.getElementById("addForm").classList.remove("open");
    document.querySelector("#addForm h2").textContent = "作品を追加";

    checkForm();

}
window.cancelEdit = cancelEdit;

//右下追加ボタン


function toggleAddForm(){

    const form = document.getElementById("addForm");

    form.classList.toggle("open");

}

//検索ボタン
function toggleSearchForm(){

    const form = document.getElementById("searchForm");

    form.classList.toggle("open");

}
 


// 削除
async function deleteWork(id){

    try{

        await deleteDoc(
            doc(db,"works",id)
        );


        works =
        works.filter(
            w=>w.id!==id
        );


        displayWorks();


        console.log("削除成功");


    }catch(error){

        console.error(
            "削除失敗",
            error
        );

    }

}

// JSON書き出し
function exportWorks(){

    const data = JSON.stringify(works, null, 2);


    const blob = new Blob(
        [data],
        {
            type:"application/json"
        }
    );


    const url = URL.createObjectURL(blob);


    const a = document.createElement("a");

    a.href = url;

    a.download = "mokuro-backup.json";

    a.click();


    URL.revokeObjectURL(url);

}



// JSON読み込みボタン
function importWorks(){

    document
    .getElementById("importFile")
    .click();

}



// JSON読み込み
function loadWorks(event){

    const file =
    event.target.files[0];


    if(!file){
        return;
    }


    const reader =
    new FileReader();


    reader.onload=function(e){

        try{

            const data =
            JSON.parse(e.target.result);


            if(!Array.isArray(data)){

                alert("正しいデータではありません");

                return;

            }


            works=data;


            displayWorks();


            alert("データを読み込みました");


        }catch(error){

            alert("読み込み失敗");

        }

    };


    reader.readAsText(file);

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
getDocs,
deleteDoc,
doc,
updateDoc
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



window.checkForm = checkForm;
window.addWork = addWork;
window.editWork = editWork;
window.deleteWork = deleteWork;
window.updateList = updateList;
window.openSettings = openSettings;
window.closeSettings = closeSettings;

window.exportWorks = exportWorks;
window.importWorks = importWorks;
window.loadWorks = loadWorks;
window.toggleAddForm = toggleAddForm;
window.toggleSearchForm = toggleSearchForm;