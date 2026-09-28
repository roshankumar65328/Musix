// console.log("script is running...");

let currentSong = new Audio();
let currentFolder;
let songs = [];

// Convert seconds into MM:SS
function secondsToMinute(input) {
    if (isNaN(input) || input < 0) {
        return "00:00";
    }

    let seconds = Math.floor(parseFloat(input));

    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;

    let mm = String(minutes).padStart(2, "0");
    let ss = String(remainingSeconds).padStart(2, "0");

    return `${mm}:${ss}`;
}


// ======================================================
// GET SONGS FROM songs.json
// ======================================================

async function getdata(folder) {

    try {

        currentFolder = folder;

        // Example:
        // /songs/Bhajan/songs.json
        const response = await fetch(`/${folder}/songs.json`);

        if (!response.ok) {
            throw new Error(
                `songs.json not found: ${response.status} ${response.statusText}`
            );
        }

        songs = await response.json();

        console.log("Current folder:", currentFolder);
        console.log("Songs:", songs);


        // ==================================================
        // SHOW ALL SONGS IN PLAYLIST
        // ==================================================

        const songUL = document
            .querySelector(".songlist")
            .getElementsByTagName("ul")[0];

        songUL.innerHTML = "";


        for (const song of songs) {

            songUL.innerHTML += `
                <li class="box">
                    <div class="song-details">
                        <i class="fa-solid fa-music"></i>

                        <p>${decodeURIComponent(song)}</p>
                    </div>
                </li>
            `;
        }


        // ==================================================
        // CLICK SONG -> PLAY SONG
        // ==================================================

        Array.from(
            document
                .querySelector(".songlist")
                .getElementsByTagName("li")
        ).forEach((e) => {

            e.addEventListener("click", () => {

                const track = e
                    .querySelector(".song-details")
                    .children[1]
                    .innerHTML
                    .trim();

                console.log("Playing:", track);

                playMusic(track);
            });

        });


        return songs;

    } catch (error) {

        console.error("getdata() error:", error);

        songs = [];

        return songs;
    }
}



// ======================================================
// PLAY MUSIC
// ======================================================

const playMusic = (track, pause = false) => {

    // Example:
    // currentFolder = songs/Bhajan
    //
    // track = song1.mp3
    //
    // Result:
    // /songs/Bhajan/song1.mp3

    currentSong.src =
        `/${currentFolder}/${encodeURIComponent(track)}`;


    if (!pause) {

        currentSong.play()
            .then(() => {

                play.src = "img/pause.svg";

            })
            .catch((error) => {

                console.error("Audio play error:", error);

            });
    }


    document.querySelector(".songinfo").innerHTML =
        decodeURIComponent(track);

    document.querySelector(".songtime").innerHTML =
        "00:00 / 00:00";
};



// ======================================================
// DISPLAY ALBUMS
// ======================================================

async function displayAlbum() {

    try {

        // Get all album/folder names
        const response = await fetch("/songs/songs.json");

        if (!response.ok) {
            throw new Error(
                `songs.json not found: ${response.status}`
            );
        }

        const folders = await response.json();

        console.log("Albums:", folders);


        const cardCont =
            document.querySelector(".card-container");

        cardCont.innerHTML = "";


        // ==================================================
        // CREATE ALBUM CARDS
        // ==================================================

        for (const folder of folders) {

            try {

                // Get album information
                const response =
                    await fetch(`/songs/${folder}/info.json`);

                if (!response.ok) {

                    console.error(
                        `info.json not found for ${folder}`
                    );

                    continue;
                }

                const info = await response.json();


                cardCont.innerHTML += `
                    <div data-folder="${folder}" class="card">

                        <img
                            src="/songs/${folder}/cover.jpg"
                            alt="${info.title}"
                        >

                        <h2>${info.title}</h2>

                        <p>${info.description}</p>

                    </div>
                `;

            } catch (error) {

                console.error(
                    `Error loading album ${folder}:`,
                    error
                );

            }
        }


        // ==================================================
        // CARD CLICK
        // ==================================================

        Array.from(
            document.getElementsByClassName("card")
        ).forEach((card) => {

            card.addEventListener("click", async () => {

                const folder =
                    card.dataset.folder;

                console.log(
                    "Selected album:",
                    folder
                );


                // Load songs
                songs = await getdata(
                    `songs/${folder}`
                );


                // Play first song
                if (songs.length > 0) {

                    playMusic(songs[0]);

                } else {

                    console.error(
                        "No songs found in:",
                        folder
                    );
                }

            });

        });

    } catch (error) {

        console.error(
            "displayAlbum() error:",
            error
        );

    }
}



// ======================================================
// MAIN
// ======================================================

async function main() {

    // ==================================================
    // LOAD DEFAULT PLAYLIST
    // ==================================================

    await getdata("songs/Bhajan");


    // Play first song but don't autoplay
    if (songs.length > 0) {

        playMusic(
            songs[0],
            true
        );

    }


    // ==================================================
    // DISPLAY ALBUMS
    // ==================================================

    await displayAlbum();



    // ==================================================
    // PLAY / PAUSE BUTTON
    // ==================================================

    play.addEventListener("click", () => {

        if (currentSong.paused) {

            currentSong.play()
                .then(() => {

                    play.src = "img/pause.svg";

                })
                .catch((error) => {

                    console.error(
                        "Play error:",
                        error
                    );

                });

        } else {

            currentSong.pause();

            play.src = "img/play.svg";
        }

    });



    // ==================================================
    // TIME UPDATE
    // ==================================================

    currentSong.addEventListener(
        "timeupdate",
        () => {

            document.querySelector(".songtime")
                .innerHTML =
                `${secondsToMinute(currentSong.currentTime)}
                 /
                 ${secondsToMinute(currentSong.duration)}`;


            if (currentSong.duration) {

                document.querySelector(
                    ".seek-circle"
                ).style.left =
                    (currentSong.currentTime /
                        currentSong.duration) *
                    100 +
                    "%";
            }

        }
    );



    // ==================================================
    // SEEK BAR
    // ==================================================

    document
        .querySelector(".seekbar")
        .addEventListener("click", (e) => {

            const circlePercent =
                (e.offsetX /
                    e.target.getBoundingClientRect().width) *
                100;


            document.querySelector(
                ".seek-circle"
            ).style.left =
                circlePercent + "%";


            if (currentSong.duration) {

                currentSong.currentTime =
                    (currentSong.duration *
                        circlePercent) /
                    100;
            }

        });



    // ==================================================
    // PREVIOUS BUTTON
    // ==================================================

    previous.addEventListener("click", () => {

        if (songs.length === 0) {
            return;
        }


        currentSong.pause();


        const currentTrack =
            decodeURIComponent(
                currentSong.src.split("/").pop()
            );


        const index =
            songs.indexOf(currentTrack);


        console.log(
            "Current song index:",
            index
        );


        if (index > 0) {

            playMusic(
                songs[index - 1]
            );

        } else {

            playMusic(
                songs[songs.length - 1]
            );

        }

    });



    // ==================================================
    // NEXT BUTTON
    // ==================================================

    next.addEventListener("click", () => {

        if (songs.length === 0) {
            return;
        }


        const currentTrack =
            decodeURIComponent(
                currentSong.src.split("/").pop()
            );


        const index =
            songs.indexOf(currentTrack);


        console.log(
            "Current song index:",
            index
        );


        if (index < songs.length - 1) {

            playMusic(
                songs[index + 1]
            );

        } else {

            playMusic(
                songs[0]
            );

        }

    });



    // ==================================================
    // VOLUME
    // ==================================================

    document
        .querySelector(".volume-container")
        .getElementsByTagName("input")[0]
        .addEventListener("change", (e) => {

            currentSong.volume =
                e.target.value / 100;


            if (currentSong.volume > 0) {

                document.querySelector(
                    ".volume-container img"
                ).src =
                    document
                        .querySelector(
                            ".volume-container img"
                        )
                        .src.replace(
                            "img/mute.svg",
                            "img/volume.svg"
                        );

            }


            if (currentSong.volume === 0) {

                document.querySelector(
                    ".volume-container img"
                ).src =
                    document
                        .querySelector(
                            ".volume-container img"
                        )
                        .src.replace(
                            "img/volume.svg",
                            "img/mute.svg"
                        );

            }

        });



    // ==================================================
    // MUTE / UNMUTE
    // ==================================================

    document
        .querySelector(".volume")
        .addEventListener("click", (e) => {

            if (
                e.target.src.includes(
                    "img/volume.svg"
                )
            ) {

                e.target.src =
                    e.target.src.replace(
                        "img/volume.svg",
                        "img/mute.svg"
                    );


                currentSong.volume = 0;


                document
                    .querySelector(
                        ".volume-container"
                    )
                    .getElementsByTagName("input")[0]
                    .value = 0;


            } else if (
                e.target.src.includes(
                    "img/mute.svg"
                )
            ) {

                e.target.src =
                    e.target.src.replace(
                        "img/mute.svg",
                        "img/volume.svg"
                    );


                currentSong.volume = 0.1;


                document
                    .querySelector(
                        ".volume-container"
                    )
                    .getElementsByTagName("input")[0]
                    .value = 30;

            }

        });



    // ==================================================
    // MOBILE MENU
    // ==================================================

    document
        .querySelector(".hamburger")
        .addEventListener("click", () => {

            document.querySelector(
                ".left"
            ).style.left = "0%";

        });


    document
        .querySelector(".close")
        .addEventListener("click", () => {

            document.querySelector(
                ".left"
            ).style.left = "-100%";

        });

}


// ======================================================
// START APP
// ======================================================

main();

// Agar aap chahein, aap apne **`songs` folder ka screenshot** bhej do; main aapke existing songs ke naam dekhkar bata dunga ki `songs.json` me exactly kya-kya likhna hai.
