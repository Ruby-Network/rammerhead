function RammerheadEncode(baseUrl: any, prefix?: string) {
  const mod = (n: any, m: any) => ((n % m) + m) % m;
  const baseDictionary =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~-";
  const shuffledIndicator = "_rhs";
  const generateDictionary = function () {
    let str = "";
    const split = baseDictionary.split("");
    while (split.length > 0) {
      str += split.splice(Math.floor(Math.random() * split.length), 1)[0];
    }
    return str;
  };
  interface StrShuffler {
    dictionary: any;
  }
  class StrShuffler {
    constructor(dictionary = generateDictionary()) {
      this.dictionary = dictionary;
    }
    shuffle(str: any) {
      if (str.startsWith(shuffledIndicator)) {
        return str;
      }
      let shuffledStr = "";
      for (let i = 0; i < str.length; i++) {
        const char = str.charAt(i);
        const idx = baseDictionary.indexOf(char);
        if (char === "%" && str.length - i >= 3) {
          shuffledStr += char;
          shuffledStr += str.charAt(++i);
          shuffledStr += str.charAt(++i);
        } else if (idx === -1) {
          shuffledStr += char;
        } else {
          shuffledStr += this.dictionary.charAt(
            mod(idx + i, baseDictionary.length)
          );
        }
      }
      return shuffledIndicator + shuffledStr;
    }
    unshuffle(str: any) {
      if (!str.startsWith(shuffledIndicator)) {
        return str;
      }

      str = str.slice(shuffledIndicator.length);

      let unshuffledStr = "";
      for (let i = 0; i < str.length; i++) {
        const char = str.charAt(i);
        const idx = this.dictionary.indexOf(char);
        if (char === "%" && str.length - i >= 3) {
          unshuffledStr += char;
          unshuffledStr += str.charAt(++i);
          unshuffledStr += str.charAt(++i);
        } else if (idx === -1) {
          unshuffledStr += char;
        } else {
          unshuffledStr += baseDictionary.charAt(
            mod(idx - i, baseDictionary.length)
          );
        }
      }
      return unshuffledStr;
    }
  }
  function get(url: any, callback: any, shush = false) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.send();

    request.onerror = function () {
      if (!shush) console.log("Cannot communicate with the server");
    };
    request.onload = function () {
      if (request.status === 200) {
        callback(request.responseText);
      } else {
        if (!shush)
          console.log(
            'unexpected server response to not match "200". Server says "' +
              request.responseText +
              '"'
          );
      }
    };
  }
  var api = {
    newsession(callback: any) {
        if (prefix) {
            get(prefix + "/newsession", callback);
        }
        else {
            get("/newsession", callback);
        }
    },
    sessionexists(id: any, callback: any) {
        if (prefix) {
            get(prefix + "/sessionexists?id=" + encodeURIComponent(id), function (res: any) {
                if (res === "exists") return callback(true);
                if (res === "not found") return callback(false);
                console.log("unexpected response from server. received" + res);
            });
        }
        else {
            get("/sessionexists?id=" + encodeURIComponent(id), function (res: any) {
                if (res === "exists") return callback(true);
                if (res === "not found") return callback(false);
                console.log("unexpected response from server. received" + res);
            });
        }
    },
    shuffleDict(id: any, callback: any) {
      console.log("Shuffling", id);
      if (prefix) {
        get(prefix + "/api/shuffleDict?id=" + encodeURIComponent(id), function (res: any) {
            callback(JSON.parse(res));
        });
      }
      else {
        get("/api/shuffleDict?id=" + encodeURIComponent(id), function (res: any) {
            callback(JSON.parse(res));
        });
      }
    }
  };
  var localStorageKey = "rammerhead_sessionids";
  var localStorageKeyDefault = "rammerhead_default_sessionid";
  var sessionIdsStore = {
    get() {
      var rawData = localStorage.getItem(localStorageKey);
      if (!rawData) return [];
      try {
        var data = JSON.parse(rawData);
        if (!Array.isArray(data)) throw "getout";
        return data;
      } catch (e) {
        return [];
      }
    },
    set(data: any) {
      if (!data || !Array.isArray(data)) throw new TypeError("must be array");
      localStorage.setItem(localStorageKey, JSON.stringify(data));
    },
    getDefault() {
      var sessionId = localStorage.getItem(localStorageKeyDefault);
      if (sessionId) {
        var data = sessionIdsStore.get();
        data.filter(function (e) {
          return e.id === sessionId;
        });
        if (data.length) return data[0];
      }
      return null;
    },
    setDefault(id: any) {
      localStorage.setItem(localStorageKeyDefault, id);
    }
  };
  function addSession(id: any) {
    var data = sessionIdsStore.get();
    data.unshift({ id: id, createdOn: new Date().toLocaleString() });
    sessionIdsStore.set(data);
  }
  function getSessionId() {
    return new Promise((resolve) => {
      var id = localStorage.getItem("session-string");
      api.sessionexists(id, function (value: any) {
        if (!value) {
          console.log("Session validation failed");
          api.newsession(function (id: any) {
            addSession(id);
            localStorage.setItem("session-string", id);
            console.log(id);
            console.log("^ new id");
            resolve(id);
          });
        } else {
          resolve(id);
        }
      });
    });
  }
  var ProxyHref;

  return getSessionId().then((id) => {
    return new Promise((resolve, reject) => {
      api.shuffleDict(id, function (shuffleDict: any) {
        var shuffler = new StrShuffler(shuffleDict);
        if (prefix) {
            ProxyHref = prefix + "/" + id + "/" + shuffler.shuffle(baseUrl);
        }
        else { ProxyHref = id + "/" + shuffler.shuffle(baseUrl); }
        console.log(ProxyHref);
        resolve(ProxyHref);
      });
    });
  });
}

//@ts-ignore
window.RammerheadEncode = RammerheadEncode;
