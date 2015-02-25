var SpotListCrd = [];
var SpotListName = [];
var SpotListAngle = [];
var myCrd;
var toCrd;
var Tel;
var dist = Infinity;
var heading = 0;
var defAngle = 0;

//SelectBox�ł̓���ł̕���_
function init() {
    myCrd = "NoData";
    defAngle = 0;
    SpotListAngle.length = 0;
    SpotListName.length = 0;
    SpotListCrd.length = 0;

    if (navigator.geolocation && document.getElementById("city").options[document.getElementById("city").selectedIndex].value != "JON") {
        navigator.geolocation.getCurrentPosition(SuccessPos, function (error) {
            myCrd = "0,0";
            alert("GPS is not Working! ErrorCode:" + error.code);
        });
    } else if (document.getElementById("city").options[document.getElementById("city").selectedIndex].value != "JON") {
        alert("GPS can not Working!!");
    } else {
        document.getElementById("Name").style.display = "none";
        document.getElementById("res").style.display = "none";
        document.getElementById("opt").style.display = "none";
        document.getElementById("modalButton").style.display = "none";
        document.getElementById("androidReload").style.display = "none";
        document.getElementById("Arrow").style.display = "none";
        document.getElementById("Crd").style.display = "none";
        document.getElementById("CC").style.display = "inline";
    }
}

//�̐S��SPARQL�Ƃ̒ʐM
//d3.json��URL�ƃN�G���̂悤�ɓ������JSON�ŋA��݂���
function SPARQL(MyCrd) {
    var cityName = document.getElementById("city").options[document.getElementById("city").selectedIndex].value;
    const query = "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>       \
            PREFIX jrrk: <http://purl.org/jrrk#>                                    \
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>               \
            PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>                  \
            PREFIX schema: <http://schema.org/>                                     \
            PREFIX ic: <http://imi.ipa.go.jp/ns/core/rdf#>                          \
                                                                                    \
            select distinct ?label ?address ?lat ?long ?telephone{                  \
            GRAPH<"+ cityName + ">{                                                 \
            ?s  rdf:type <http://purl.org/jrrk#EmergencyFacility>;                  \
            rdfs:label ?label;                                                      \
            jrrk:address ?address ;                                                 \
            geo:lat ?lat;                                                           \
            geo:long ?long;                                                         \
            schema:telephone ?telephone;                                            \
            }}";
    var url = "http://sparql.odp.jig.jp/api/v1/sparql?query=" + encodeURIComponent(query) + "&output=json";
    d3.json(url, function (error, data) {
        var jsons = data["results"]["bindings"];
        for (var i = 0; i < jsons.length; i++) {
            SpotListCrd[SpotListCrd.length] = jsons[i].lat.value + "," + jsons[i].long.value;
            SpotListName[SpotListName.length] = jsons[i].label.value;
        }
        if (jsons.length > 0) {
            var MLB = calculate(MyCrd);
            var pName = document.getElementById("Name");
            pName.style.display = "block";
            defAngle = SpotListAngle[MLB];
            pName.innerText = "���ꏊ�́u" + SpotListName[MLB] + "�v�ł��B";
            if (jsons[MLB].telephone != null)
                Tel = jsons[MLB].telephone.value;
            document.getElementById("opt").style.display = "block";
            document.getElementById("Crd").style.display = "inline";
            document.getElementById("Crd").innerText = "�����͖�" + dist.toFixed(1) + "m�ł��B";
            document.getElementById("CC").style.display = "none";
        }
    });
}

//�p�x�v�Z
function geoDirection(lat1, lng1, lat2, lng2) {
    var Y = Math.cos(lng2 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180 - lat1 * Math.PI / 180);
    var X = Math.cos(lng1 * Math.PI / 180) * Math.sin(lng2 * Math.PI / 180) - Math.sin(lng1 * Math.PI / 180) * Math.cos(lng2 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180 - lat1 * Math.PI / 180);
    var dirE0 = 180 * Math.atan2(Y, X) / Math.PI; // ��������0�x�̕���
    if (dirE0 < 0) {
        dirE0 = dirE0 + 360; //0�`360 �ɂ���B
    }
    var dirN0 = (dirE0 + 90) % 360; //(dirE0+90)��360�̗]����o�� �k������0�x�̕���
    return dirN0;
}

//�����v�Z
function calcdist(crd1, crd2) {
    var LonLat1 = crd1.split(",");
    var LonLat2 = crd2.split(",");
    var distAngle = distance(LonLat1[0], LonLat1[1], LonLat2[0], LonLat2[1]);
    SpotListAngle[SpotListAngle.length] = geoDirection(LonLat1[0], LonLat1[1], LonLat2[0], LonLat2[1]);
    return distAngle;
}

//��ԋ߂��Ƃ�������������ŒT��
function calculate(MyCrd) {
    var ret;
    var dis;
    dist = Infinity;
    for (var i = 0; i < SpotListCrd.length; i++) {
        dis = calcdist(MyCrd, SpotListCrd[i]);
        if (dist > dis) {
            dist = dis;
            ret = i;
        }
    }
    toCrd = SpotListCrd[ret];
    return ret;
}

//Geolocation�̐������s�֐�
function SuccessPos(position) {
    myCrd = position.coords.latitude.toString() + "," + position.coords.longitude.toString();

    SPARQL(myCrd);


    if ((navigator.userAgent.indexOf('iPhone') > 0 &&
        navigator.userAgent.indexOf('iPad') == -1) ||
        navigator.userAgent.indexOf('iPod') > 0) {
        document.getElementById("modalButton").style.display = "inline";
    } else if (navigator.userAgent.indexOf('Android') > 0) {
        document.getElementById("androidReload").style.display = "inline";
        document.getElementById("res").style.display = "inline";
        setTimeout('InitializeMap()', 100);
    } else {
        document.getElementById("res").style.display = "inline";
        setTimeout('InitializeMap()', 100);
    }
}
function ErrorPos(error) {
    alert("GPS is not Working! ErrorCode:" + error.code);
}

//�n�}�\��
function InitializeMap() {
    var directionService = new google.maps.DirectionsService();
    var directionDisplay = new google.maps.DirectionsRenderer();
    var now = new google.maps.LatLng();
    var mapOptions = { mapTypeId: google.maps.MapTypeId.ROADMAP };
    var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
    directionDisplay.setMap(map);

    var start = myCrd;
    var end = toCrd;
    var request = { origin: start, destination: end, travelMode: google.maps.TravelMode.DRIVING };
    directionService.route(request, function (result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionDisplay.setDirections(result);
        }
    });
}

//URL�X�L�[�}����
function telephone() {
    location.href = "tel:" + Tel;
}
function gmap() {
    if (window.confirm("Map�A�v���ŊJ���܂�"))
        location.href = "http://maps.apple.com/maps?&saddr=" + myCrd + "&daddr=" + toCrd;
}

//iOS�W���R���p�X�擾
function iOS(e) {
    //iOS�W���R���p�X�擾
    heading = e.webkitCompassHeading - defAngle;
    if (heading < 0) heading += 360;
    heading += window.orientation;
    Arrow.style.webkitTransform = 'rotate(-' + (heading) + 'deg)';

    window.addEventListener("compassneedscalibration", function (event) {
        alert('�R���p�X������������܂���B8�̎���`���悤�Ƀf�o�C�X�𓮂����Ă��������B');
        event.preventDefault();
    }, true);

    if (document.getElementById("city").options[document.getElementById("city").selectedIndex].value != "JON")
        document.getElementById("Arrow").style.display = "inline";
}
//Android�͒��߂Ēn�}�\��
function android() {
    var map = document.createElement("div");
    document.getElementById("res").appendChild(map);
    map.setAttribute("id", "map_canvas");
    map.style.width = "100%";
    map.style.height = "60%";
}
//Load���ɒ[���ŕ���
window.addEventListener('load', function () {
    if ((navigator.userAgent.indexOf('iPhone') > 0 &&
        navigator.userAgent.indexOf('iPad') == -1) ||
        navigator.userAgent.indexOf('iPod') > 0) {
        window.addEventListener('deviceorientation', iOS, false);
    } else if (navigator.userAgent.indexOf('Android') > 0) {
        android();
    } else {
        document.getElementById("res").innerHTML = "<br/><h3>���̃f�o�C�X�͑Ή����Ă���܂���B</h3>";
        document.getElementById("res").style.display = "block";
        document.getElementById("city").style.display = "none";
    }
}, false);