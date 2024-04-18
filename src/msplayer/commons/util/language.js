export function translateLanguage(lang){
    switch(lang) {
        case 'ca':
        case 'cat':
          return 'Catalán'
        break
        case 'en':
        case 'eng':
          return 'Inglés'
        break
        case 'eu':
        case 'eus':
          return 'Euskera'
        break
        case 'es':
        case 'spa':
          return 'Español'
        break
        case 'gl':
        case 'glg':
          return 'Gallego'
        break
        case 'ru':
        case 'rus':
          return 'Ruso'
        break
        case 'fr':
        case 'fra':
          return 'Francés'
        break
        case 'it':
        case 'ita':
          return 'Italiano'
        break
        case 'de':
        case 'deu':
          return 'Aleman'
        break
        case 'pt':
        case 'por':
          return 'Portugués'
        break
        case 'tr':
        case 'tur':
          return 'Turco'
        break
        case 'hi':
        case 'hin':
          return 'Hindi'
        break
        case 'ar':
        case 'ara':
          return 'Árabe'
        break
        default:
         return
        break
    }
    return
}
