const texts = {
    1: "Salut",
    2: "Hello"
}

const pictures = [
    {
        id: 1,
        srcSmall: "1.jpg",
        srcLarge: "1.jpg",
        text: "Depuis quelques temps, il se passe beaucoup de choses assez incroyables dans ma vie. J'ai commencé par découvrir un nouveau quartier..."
    },
    {
        id: 2,
        srcSmall: "2.jpg",
        srcLarge: "2.jpg",
        text: "Je suis allé à un nouveau festival"
    },
    {
        id: 3,
        srcSmall: "3.gif",
        srcLarge: "3.gif",
        text: "J'ai navigué dans des canaux"
    },
    {
        id: 4,
        srcSmall: "4s.jpg",
        srcLarge: "4.jpg",
        text: "Découvert une petite île méditerranéenne"
    },
    {
        id: 5,
        srcSmall: "5s.jpg",
        srcLarge: "5.jpg",
        text: "Je suis allé voir des expositions lumineuses"
    },
    {
        id: 6,
        srcSmall: "6.jpg",
        srcLarge: "6.jpg",
        text: "Je me suis mis au roller derby, j'ai même vu un match au zénith !"
    },
    {
        id: 7,
        srcSmall: "7s.jpg",
        srcLarge: "7.jpg",
        text: "Je suis allé au mariage de mes nouveau amis"
    },
    {
        id: 8,
        srcSmall: "8.jpg",
        srcLarge: "8.jpg",
        text: "J'ai fait du patin à glace à Stockholm"
    },
    {
        id: 9,
        srcSmall: "9.jpg",
        srcLarge: "9.jpg",
        text: "Visité Prague de bas..."
    },
    {
        id: 10,
        srcSmall: "10.jpg",
        srcLarge: "10.jpg",
        text: "en haut !"
    },
    {
        id: 11,
        srcSmall: "11s.jpg",
        srcLarge: "11.jpg",
        text: "J'ai fait des petits weekend de détente, peu importe la météo"
    },
    {
        id: 12,
        srcSmall: "12s.jpg",
        srcLarge: "12.jpg",
        text: "Essayé 80% des restos parisiens"
    },
    {
        id: 13,
        srcSmall: "13.jpg",
        srcLarge: "13.jpg",
        text: "J'ai aussi fait le meilleur voyage de ma vie, pendant lequel j'ai vécu des aventures tous les jours"
    },
    {
        id: 14,
        srcSmall: "14s.jpg",
        srcLarge: "14.jpg",
        text: "Comme mettre un sarong pour visiter des temples de toutes formes"
    },
    {
        id: 15,
        srcSmall: "15s.jpg",
        srcLarge: "15.jpg",
        text: "Ou travailler mes cuisses et mes fesses en montant des centaines de marches"
    },
    {
        id: 16,
        srcSmall: "16s.jpg",
        srcLarge: "16.jpg",
        text: "Mais avec des cascades en récompense, pas dégueu"
    },
    {
        id: 17,
        srcSmall: "17s.jpg",
        srcLarge: "17.jpg",
        text: "J'ai aussi traversé des rizières qui s'étendent à perte de vue, avec leurs animaux et leurs déesses du riz"
    },
    {
        id: 18,
        srcSmall: "18.jpg",
        srcLarge: "18.jpg",
        text: "Admiré des paysages magnifique au rythme du soleil, et fait de la balançoire"
    },
    {
        id: 19,
        srcSmall: "19.jpg",
        srcLarge: "19.jpg",
        text: "Pris des risques en respirant du souffre, mais pas de trop près non plus, donc ça va"
    },
    {
        id: 20,
        srcSmall: "20.jpg",
        srcLarge: "20.jpg",
        text: "J'ai vu le jour se lever sur un volcan"
    },
    {
        id: 21,
        srcSmall: "21.gif",
        srcLarge: "21.gif",
        text: "Puis un autre"
    },
    {
        id: 22,
        srcSmall: "22.jpg",
        srcLarge: "22.jpg",
        text: "Heureusement j'ai pu aussi me relaxer"
    },
    {
        id: 23,
        srcSmall: "23.jpg",
        srcLarge: "23.jpg",
        text: "Sur des plages infinies avec un petit jus de coco, des chèvres, des singes et des vaches bien sûr"
    },
    {
        id: 24,
        srcSmall: "24s.jpg",
        srcLarge: "24.jpg",
        text: "J'ai plongé dans la mer pour chercher némo, les autres poissons et sa pote la tortue"
    },
    {
        id: 25,
        srcSmall: "25s.jpg",
        srcLarge: "25.jpg",
        text: "Même en France les découvertes furent nombreuses, au Sud..."
    },
    {
        id: 26,
        srcSmall: "26.jpg",
        srcLarge: "26.jpg",
        text: "Comme au Nord"
    },
    {
        id: 27,
        srcSmall: "27s.jpg",
        srcLarge: "27.jpg",
        text: "J'ai fini par entrer dans une nouvelle décennie, en étant patient et en dansant un petit peu quand même"
    },
    {
        id: 28,
        srcSmall: "28.jpg",
        srcLarge: "28.jpg",
        text: "J'ai fait la connaissance d'une championne de ski"
    },
    {
        id: 29,
        srcSmall: "29.jpg",
        srcLarge: "29.jpg",
        text: "Avec qui j'ai bravé les pistes les plus dangereuses"
    },
    {
        id: 30,
        srcSmall: "30s.jpg",
        srcLarge: "30.jpg",
        text: "Le froid de la neige m'a donné envie de me réchauffer au Danemark"
    },
    {
        id: 31,
        srcSmall: "31.jpg",
        srcLarge: "31.jpg",
        text: "En mangeant un petit hotdog, parce qu'il y avait plus de pain pour les gros, mais c'était déjà pas mal"
    },
    {
        id: 32,
        srcSmall: "32.jpg",
        srcLarge: "32.jpg",
        text: "C'était aussi l'occasion de faire des échanges culturels avec les corbeaux locaux"
    },
    {
        id: 33,
        srcSmall: "33.gif",
        srcLarge: "33.gif",
        text: "En tout cas c'était très joli, et maintenant je sais prononcer Nyhavn"
    },
    {
        id: 34,
        srcSmall: "34s.jpg",
        srcLarge: "34.jpg",
        text: "Car j'ai bien pris le temps de m'instruire"
    },
    {
        id: 35,
        srcSmall: "35s.jpg",
        srcLarge: "35.jpg",
        text: "Pendant tout ce temps j'ai fait et reçu plus de bisous qu'il n'y a d'étoiles dans le ciel (je le sais car je les ai observées)"
    },
    {
        id: 36,
        srcSmall: "36s.jpg",
        srcLarge: "36.jpg",
        text: "Tous ces moments m'ont donné le sourire, c'est pourquoi il faut bien prendre soin de ses dents !" +
         "Pour tout ça je te remercie Emm, revoir toutes ces photos m'a rappelé pourquoi j'étais chaque jour heureux d'être avec toi. Je t'aime !"
    }
]

export default pictures