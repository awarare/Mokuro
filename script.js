let works = JSON.parse(localStorage.getItem("works")) || [];
let editIndex = null;


function checkForm() {

    const title = document.getElementById("title").value;
    const category = document.getElementById("category").value;
    const button = document.getElementById("addButton");

    button.disabled = (
        title.trim() === "" ||
        category === ""
    );

}


function addWork() {

    const title = document.getElementById("title").value;
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;
    const memo = document.getElementById("memo").value;

    const work = {
        title: title,
        category: category,
        date: date,
        memo: memo
    };

    if (editIndex === null) {

    works.push(work);

} else {

    works[editIndex] = work;

    editIndex = null;

}

    localStorage.setItem("works", JSON.stringify(works));

    displayWorks();

    document.getElementById("title").value = "";
    document.getElementById("category").value = "";
    document.getElementById("date").value = "";
    document.getElementById("memo").value = "";

    checkForm();

}



function displayWorks() {

    const workList = document.getElementById("workList");

    workList.innerHTML = "";

    works.forEach(function(work, index) {

        const card = `
        <div class="card">
            <h2>${work.title}</h2>
            <p>${work.category}</p>
            <p>${work.date}</p>
            <p>${work.memo}</p>

            <button onclick="editWork(${index})">
    編集
</button>

<button onclick="deleteWork(${index})">
    削除
</button>
        </div>
        `;

        workList.innerHTML += card;

    });

}


function deleteWork(index) {

    works.splice(index, 1);

    localStorage.setItem("works", JSON.stringify(works));

    displayWorks();

}


function editWork(index) {

    const work = works[index];

    document.getElementById("title").value = work.title;
    document.getElementById("category").value = work.category;
    document.getElementById("date").value = work.date;
    document.getElementById("memo").value = work.memo;

}


displayWorks();
function editWork(index) {

    const work = works[index];

    document.getElementById("title").value = work.title;
    document.getElementById("category").value = work.category;
    document.getElementById("date").value = work.date;
    document.getElementById("memo").value = work.memo;

    editIndex = index;

}