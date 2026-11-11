// ==========================================
// Firebase
// ==========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();


// ==========================================
// 状態
// ==========================================

let works = [];
let editId = null;
let deleteTargetId = null;


// ==========================================
// 共通
// ==========================================

// ログイン中ユーザーの作品コレクション
function worksRef(){

    return collection(
        db,
        "users",
        auth.currentUser.uid,
        "works"
    );

}

// HTMLの特殊文字を無害な文字に変換
function escapeHtml(text){

    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

}


// ==========================================
// 表示
// ==========================================

// 空の状態を表示
function showEmpty(message){

    document.getElementById("workList").innerHTML = `
        <div class="empty">
            <div class="empty-icon">
                <i data-lucide="book-open"></i>
            </div>
            <p>${message}</p>
        </div>
    `;

    lucide.createIcons();

}

// 一覧を表示
function displayWorks(list = works){

    const workList = document.getElementById("workList");

    if(list.length === 0){

        showEmpty("まだ記録がありません");

        return;

    }

    workList.innerHTML = list.map(function(work){

        const statusTag = work.status
            ? `<span class="status-tag">${escapeHtml(work.status)}</span>`
            : "";

        return `
        <div class="card">

            <h2>${escapeHtml(work.title)}</h2>

            <div class="tags">
                <span class="category-tag">${escapeHtml(work.category)}</span>
                ${statusTag}
            </div>

            <p>${escapeHtml(work.date)}</p>

            <p class="memo">${escapeHtml(work.memo)}</p>

            <div class="card-buttons">
                <button onclick="editWork('${work.id}')">編集</button>
                <button onclick="deleteWork('${work.id}')">削除</button>
            </div>

        </div>
        `;

    }).join("");

}

// 検索・分類・並び替えをまとめて反映
function updateList(){

    const keyword =
        document.getElementById("search").value.toLowerCase();

    const category =
        document.getElementById("filterCategory").value;

    const type =
        document.getElementById("sort").value;

    const result = works.filter(function(work){

        const matchKeyword =
            (work.title || "").toLowerCase().includes(keyword) ||
            (work.memo || "").toLowerCase().includes(keyword);

        const matchCategory =
            category === "" ||
            work.category === category;

        return matchKeyword && matchCategory;

    });

  // 変更後
    result.sort(function(a, b){

        if(type === "name"){
            return (a.title || "").localeCompare(b.title || "", "ja");
        }

        // 日付なしは「一番新しい」扱い
        // 新しい順 → 一番上 / 古い順 → 一番下
        if(!a.date && !b.date) return 0;
        if(!a.date) return type === "old" ? 1 : -1;
        if(!b.date) return type === "old" ? -1 : 1;

        const diff = new Date(b.date) - new Date(a.date);

        return type === "old" ? -diff : diff;

    });

    displayWorks(result);      // ← 追加

}                              // ← 追加(updateList を閉じる)

// ==========================================
// Firebase読み込み
// ==========================================

async function loadFirebaseWorks(){

    const snapshot = await getDocs(worksRef());

    works = [];

    snapshot.forEach(function(item){

        works.push({
            id: item.id,
            ...item.data()
        });

    });

    updateList();

}


// ==========================================
// 追加・編集
// ==========================================

// 追加ボタンの有効・無効
function checkForm(){

    const title = document.getElementById("title").value;
    const category = document.getElementById("category").value;
    const button = document.getElementById("addButton");

    button.disabled = (
        title.trim() === "" ||
        category === ""
    );

}
// 今日の日付 (YYYY-MM-DD)
function today(){

    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${d.getFullYear()}-${m}-${day}`;

}
async function addWork(){

    if(!auth.currentUser){
        alert("ログインすると作品を記録できます");
        return;
    }

    // 連打防止: 保存が終わるまで押せなくする
    document.getElementById("addButton").disabled = true;

    const work = {
        title: document.getElementById("title").value,
        category: document.getElementById("category").value,
        status: document.getElementById("status").value,
        date: document.getElementById("date").value,
        memo: document.getElementById("memo").value
    };

    try{

        // 編集の場合
        if(editId){

            await updateDoc(
                doc(
                    db,
                    "users",
                    auth.currentUser.uid,
                    "works",
                    editId
                ),
                work
            );

            works = works.map(function(item){

                if(item.id === editId){
                    return { id: editId, ...work };
                }

                return item;

            });

            console.log("Firestore更新成功");

            editId = null;

            document.getElementById("addButton").textContent = "追加";
            document.getElementById("cancelButton").style.display = "none";
            document.querySelector("#addForm h2").textContent = "作品を追加";

        }

        // 新規追加の場合
        else{

            const docRef = await addDoc(worksRef(), work);

            works.push({
                id: docRef.id,
                ...work
            });

            console.log("Firestore保存成功 ID:", docRef.id);

        }

        updateList();

        document.getElementById("title").value = "";
        document.getElementById("category").value = "";
        document.getElementById("status").value = "";
        document.getElementById("date").value = "";
        document.getElementById("memo").value = "";
        document.getElementById("addForm").classList.remove("open");

    }catch(error){

        console.error("保存失敗", error);
        alert("保存に失敗しました");

    }finally{

        // 成功: 入力欄が空なので無効のまま
        // 失敗: 入力が残っているので押せる状態に戻る
        checkForm();

    }

}

// 編集開始
function editWork(id){

    const work = works.find(w => w.id === id);

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

    // 編集フォームを開く
    document.getElementById("addForm").classList.add("open");

    checkForm();

    document.getElementById("addForm").scrollIntoView({
        behavior: "smooth"
    });

}

// 編集キャンセル
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

// 右下の「+」ボタン
// 右下の「+」ボタン
function toggleAddForm(){

    const form = document.getElementById("addForm");

    // 未ログインでは開かせない(閉じるのは常にOK)
    if(!auth.currentUser && !form.classList.contains("open")){
        alert("ログインすると作品を記録できます");
        return;
    }

    form.classList.toggle("open");

}

// 検索フォームの開閉
function toggleSearchForm(){

    document.getElementById("searchForm").classList.toggle("open");

}


// ==========================================
// 削除
// ==========================================

// 削除ボタンを押したとき: ダイアログを開くだけ
function deleteWork(id){

    const work = works.find(w => w.id === id);

    if(!work){
        return;
    }

    deleteTargetId = id;

    // textContentなので、作品名にHTMLが入っていても安全
    document.getElementById("deleteDialogTitle").textContent =
        `「${work.title}」を削除しますか?`;

    document.getElementById("deleteOverlay").style.display = "block";
    document.getElementById("deleteDialog").classList.add("open");

}

// ダイアログを閉じる
function closeDeleteDialog(){

    deleteTargetId = null;

    document.getElementById("deleteOverlay").style.display = "none";
    document.getElementById("deleteDialog").classList.remove("open");

}

// 「削除」を押したとき: 実際に削除
async function confirmDelete(){

    const id = deleteTargetId;

    if(!id){
        return;
    }

    closeDeleteDialog();

    try{

        await deleteDoc(
            doc(
                db,
                "users",
                auth.currentUser.uid,
                "works",
                id
            )
        );

        works = works.filter(w => w.id !== id);

        updateList();

        console.log("削除成功");

    }catch(error){

        console.error("削除失敗", error);

    }

}


// ==========================================
// バックアップ（JSON）
// ==========================================

// 書き出し
function exportWorks(){

    const data = JSON.stringify(works, null, 2);

    const blob = new Blob(
        [data],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "mokuro-backup.json";
    a.click();

    URL.revokeObjectURL(url);

}

// 読み込みボタン
function importWorks(){

    document.getElementById("importFile").click();

}

// 読み込み
function loadWorks(event){

    const file = event.target.files[0];

    if(!file){
        return;
    }

    if(!auth.currentUser){
        alert("先にGoogleログインしてください");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = async function(e){

        try{

            const data = JSON.parse(e.target.result);

            if(!Array.isArray(data)){
                alert("正しいデータではありません");
                return;
            }

            const uid = auth.currentUser.uid;
            let count = 0;

            for(const item of data){

                // タイトルと分類がないデータは飛ばす
                if(!item.title || !item.category){
                    continue;
                }

                const work = {
                    title: item.title,
                    category: item.category,
                    status: item.status || "",
                    date: item.date || "",
                    memo: item.memo || ""
                };

                if(item.id){
                    // IDあり: 同じIDで上書き or 新規作成
                    await setDoc(
                        doc(db, "users", uid, "works", item.id),
                        work
                    );
                }else{
                    // IDなし: 新しいIDで追加
                    await addDoc(worksRef(), work);
                }

                count++;

            }

            // Firebaseから読み直して画面を更新
            await loadFirebaseWorks();

            alert(`${count}件を読み込みました`);

        }catch(error){

            console.error("読み込み失敗", error);
            alert("読み込み失敗");

        }

        // 同じファイルをもう一度選べるようにリセット
        event.target.value = "";

    };

    reader.readAsText(file);

}


// ==========================================
// 設定シート
// ==========================================

function openSettings(){

    document.getElementById("overlay").style.display = "block";
    document.getElementById("settingsSheet").classList.add("open");

}

function closeSettings(){

    document.getElementById("overlay").style.display = "none";
    document.getElementById("settingsSheet").classList.remove("open");

}


// ==========================================
// 旧データの移行（一回きり）
// ==========================================

async function migrateWorks(){

    const user = auth.currentUser;

    if(!user){
        alert("先にGoogleログインしてください");
        return;
    }

    try{

        // 旧データ取得
        const snapshot = await getDocs(
            collection(db, "works")
        );

        let count = 0;

        for(const workDoc of snapshot.docs){

            await setDoc(
                doc(db, "users", user.uid, "works", workDoc.id),
                workDoc.data()
            );

            count++;

        }

        alert(`${count}件コピーしました！`);

        console.log("移行完了");

    }catch(error){

        console.error(error);

    }

}


// ==========================================
// ログイン
// ==========================================

async function loginGoogle(){

    await signInWithPopup(auth, provider);

}

async function logout(){

    await signOut(auth);

}

onAuthStateChanged(auth, (user) => {

    const loginButton = document.getElementById("loginButton");
    const userArea = document.getElementById("userArea");

    if(user){

        // ログイン時：ログインボタンを隠して、ユーザーエリアを表示
        loginButton.style.display = "none";
        userArea.style.display = "flex";

        document.getElementById("dropdownName").textContent =
            user.displayName || "ユーザー";

        document.getElementById("dropdownEmail").textContent =
            user.email || "";

        const img = document.getElementById("userPhoto");
        img.src = user.photoURL || "";
        img.hidden = false;

        loadFirebaseWorks();

    }else{

        // 未ログイン時：ログインボタンを表示して、ユーザーエリアを隠す
        loginButton.style.display = "block";
        userArea.style.display = "none";

        // 前のユーザーの作品を消して、案内を表示
        works = [];

        showEmpty("ログインすると作品を記録できます");

    }

});


// ==========================================
// アカウントメニューの開閉
// ==========================================

const accountButton = document.getElementById("accountButton");
const dropdown = document.getElementById("userDropdown");
const accountArea = document.getElementById("accountArea");

accountButton.addEventListener("click", () => {
    dropdown.classList.toggle("hidden");
});

// メニューの外を押したら閉じる
document.addEventListener("click", (e) => {

    if(
        !accountArea.contains(e.target) &&
        !dropdown.contains(e.target)
    ){
        dropdown.classList.add("hidden");
    }

});


// ==========================================
// HTMLのonclickから呼べるように公開
// ==========================================

window.auth = auth;
window.loginGoogle = loginGoogle;
window.logout = logout;

window.checkForm = checkForm;
window.addWork = addWork;
window.editWork = editWork;
window.cancelEdit = cancelEdit;
window.deleteWork = deleteWork;
window.closeDeleteDialog = closeDeleteDialog;
window.confirmDelete = confirmDelete;
window.updateList = updateList;
window.toggleAddForm = toggleAddForm;
window.toggleSearchForm = toggleSearchForm;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.exportWorks = exportWorks;
window.importWorks = importWorks;
window.loadWorks = loadWorks;
window.migrateWorks = migrateWorks;

console.log("Firebase接続OK");

lucide.createIcons();