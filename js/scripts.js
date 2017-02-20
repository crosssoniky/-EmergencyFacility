var nowpos,topos,map,directionsDisplay,directionsService;

const odp="PREFIX odp:<http://odp.jig.jp/odp/1.0#>";
const dcterms="PREFIX dcterms:<http://purl.org/dc/terms/>";
const rdfs="PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>";
const geo="PREFIX geo:<http://www.w3.org/2003/01/geo/wgs84_pos#>";
const rdf="PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>";
const jrrk="PREFIX jrrk:<http://purl.org/jrrk#>";
const baseQuery=[rdfs+geo+rdf+jrrk+"select distinct *{?s rdf:type jrrk:",";rdfs:label ?label;geo:lat ?lat;geo:long ?long;jrrk:address ?address;FILTER(regex(str(?s), "," ))}"];
const baseURL="https://sparql.odp.jig.jp/api/v1/sparql?output=json&query=";
const citiesQuery=odp+dcterms+rdfs+geo+rdf+'select distinct ?lat ?long ?labelen ?labeljp{?uri rdf:type odp:Dataset;dcterms:publisher ?name1.?name1 rdfs:label ?name.optional{?uri dcterms:modified ?d}?s rdf:type odp:OpenDataCity;rdfs:label ?labelen;rdfs:label ?labeljp;geo:lat ?lat;geo:long ?long;FILTER (regex(?name,"都")||regex(?name,"道")||regex(?name,"府")||regex(?name,"県"))FILTER regex(?labeljp,"^"+?name+"$")BIND (lang(?labelen) AS ?language)FILTER regex(str(?language),"en")BIND(lang(?labeljp) AS ?language2)FILTER regex(str(?language2),"ja")}ORDER BY ?labeljp';


//SelectBoxでの動作での分岐点
onload=function () {
    $('#canvas')[0].style.width=window.innerWidth*0.8;
    $('#canvas')[0].style.height=window.innerHeight*0.5;
    directionsDisplay=new google.maps.DirectionsRenderer();
    directionsService=new google.maps.DirectionsService();


    var NowCity='なんでもない県どこか市';
    if (window.navigator.geolocation) {
        window.navigator.geolocation.getCurrentPosition(
            function (position) {
                latlng=new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
                nowpos=latlng;
                mapDrawing();
                var geocoder=new google.maps.Geocoder();
                geocoder.geocode({
                    latLng: latlng
                },function (results,status) {
                    if (status==google.maps.GeocoderStatus.OK) {
                        if (results[0].geometry) {
                            var address=results[0].formatted_address.split(' ');
                            NowCity=address[2];
                        }
                    }
                    CitySet(NowCity,true);
                    setInterval("nowposUpdate()",10000);
                });
            },
            function (error) {
                alert("位置情報取得エラー:"+error.message);
                CitySet(NowCity,false);
                nowpos=new google.maps.LatLng(35,135);
                mapDrawing();
            },
            {
                enableHighAccuracy: true,
                timeout: 2000,
                maximumAge: 60000
            }
        );
    }
}
function CitySet(NowCityNoYATSU,flag) {
    var NowCities=NowCityNoYATSU.split('県');
    var NowCity="HelloWorld!";
    try {
        NowCity=NowCities[1].split(/市|町|村/)[0];
    } catch (e) { }
    var url=baseURL+encodeURIComponent(citiesQuery);
    d3.json(url,function (error,data) {
        var jsons=data["results"]["bindings"];
        if (jsons.length==0) {
            alert('データベース内に見つかりませんでした。');
            return false;
        }
        var selected=false;
        for (var i=0;i<jsons.length;i++) {
            var Administration='日本';
            switch (jsons[i].labeljp.value.split(/道|都|府|県/)[0]) {
                case '北海': Administration='Hokkaido'; break;
                case '青森':
                case '秋田':
                case '岩田':
                case '宮城':
                case '山形':
                case '福島': Administration='Tohoku'; break;
                case '茨城':
                case '栃木':
                case '群馬':
                case '埼玉':
                case '千葉':
                case '東京':
                case '神奈川': Administration='Kanto'; break;
                case '山梨':
                case '長野':
                case '新潟':
                case '富山':
                case '石川':
                case '福井':
                case '静岡':
                case '愛知':
                case '岐阜': Administration='Chubu'; break;
                case '三重':
                case '滋賀':
                case '京都':
                case '大阪':
                case '兵庫':
                case '奈良':
                case '和歌山': Administration='Kinki'; break;
                case '鳥取':
                case '島根':
                case '岡山':
                case '広島':
                case '山口': Administration='Chugoku'; break;
                case '香川':
                case '愛媛':
                case '徳島':
                case '高知': Administration='Shikoku'; break;
                case '福岡':
                case '佐賀':
                case '長崎':
                case '熊本':
                case '大分':
                case '宮崎':
                case '鹿児島':
                case '沖縄': Administration='Kyusyu'; break;
            }

            $('#'+Administration).append($('<option id="select'+i+'">').html(jsons[i].labeljp.value/*+','+jsons[i].labelen.value.split('-')[0]).val(jsons[i].labelen.value.split('-')[0].toLowerCase()*/));
            document.getElementById('select'+i).setAttribute('data-latitude',jsons[i].lat.value);
            document.getElementById('select'+i).setAttribute('data-longitude',jsons[i].long.value);
            document.getElementById('select'+i).setAttribute('data-labelen',jsons[i].labelen.value.split('-')[0].toLowerCase());
            if (NowCities.length>1) {
                if (jsons[i].labeljp.value.match(NowCity)!=null) {
                    document.getElementById('select'+i).selected=true;
                    selected=true;
                }
            }
        }
        if (!selected) {
            for (var i=0;i<jsons.length;i++) {
                if (jsons[i].labeljp.value.length<5&&jsons[i].labeljp.value.match(NowCities[0])!=null) {
                    document.getElementById('select'+i).selected=true;
                    selected=true;
                }
            }
        }
        if (flag)
            DataResourceChange($('#citySelection'));
        return true;
    });
}

function DataResourceChange(select) {
    var selectedItem=select.options.item(select.selectedIndex);
    checkShelter(selectedItem.getAttribute('data-labelen'));
}

function mapDrawing() {
    var opts={
        zoom: 10,
        center: nowpos,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };
    map=new google.maps.Map($('#canvas')[0],opts);
}

function nowposUpdate() {
    if (window.navigator.geolocation) {
        window.navigator.geolocation.getCurrentPosition(
            function (position) {
                nowpos=new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 60000
            }
        );
    }
}

function checkShelter(cityName) {
    var query=baseQuery[0]+"EmergencyFacility"+baseQuery[1]+'"'+cityName+'"'+baseQuery[2];
    var url=baseURL+encodeURIComponent(query);
    d3.json(url,function (error,data) {
        var jsons=data["results"]["bindings"];
        if (jsons.length==0) {
            alert('データベース内に見つかりませんでした。');
            document.getElementById("Arrow").style.display="none";
            return;
        }
        jsons=TargetSortByDistance(jsons);
        topos=new google.maps.LatLng(jsons[0].lat.value,jsons[0].long.value);

        var request={
            origin: nowpos,
            destination: topos,
            avoidHighways: true,
            avoidTolls: true,
            travelMode: google.maps.DirectionsTravelMode.WALKING
        }
        directionsService.route(request,function (result,status) {
            if (status==google.maps.DirectionsStatus.OK) {
                dis=result.routes[0].legs[0].distance.value;

                directionsDisplay.setMap(null);
                directionsDisplay.setDirections(null);
                directionsDisplay.setDirections(result);
                directionsDisplay.setMap(map);
            } else {
                console.log(status);
                alert(status);
            }
        },function (err) {
            alert(err);
        });
    }).on("error",function (error) {
        topos=new google.maps.LatLng();
        alert('データベース内に見つかりませんでした。');
        document.getElementById("Arrow").style.display="none";
    });
}

function TargetSortByDistance(json) {
    json.sort(function (a,b) {
        var aPos=new google.maps.LatLng(a.lat.value,a.long.value);
        var bPos=new google.maps.LatLng(b.lat.value,b.long.value);
        var aDis=google.maps.geometry.spherical.computeDistanceBetween(nowpos,aPos);
        var bDis=google.maps.geometry.spherical.computeDistanceBetween(nowpos,bPos);
        if (aDis<bDis) {
            return -1;
        }
        if (aDis>bDis) {
            return 1;
        }
        return 0;
    });
    return json;
}

function Scheme() {
    if (userAgent.indexOf('iPhone')>-1) {
        var scheme='comgooglemaps-x-callback://?saddr='+NowPos.lat()+','+NowPos.lng()+'&daddr='+distination.lat()+','+distination.lng()+'&directionsmode=walking';
        window.location.href=scheme;
    } else {
        var scheme='http://maps.google.com?saddr='+NowPos.lat()+','+NowPos.lng()+'&daddr='+distination.lat()+','+distination.lng()+'&directionsmode=walking';
        window.location.href=scheme;
    }
}