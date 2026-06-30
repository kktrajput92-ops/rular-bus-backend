function JourneyBus() {

  return (

    <div
      style={{
        width: "100%",
        margin: "20px 0",
        overflow: "hidden",
      }}
    >

      <div
        style={{
          textAlign: "center",
          fontSize: "54px",
          animation: "busBounce .8s ease-in-out infinite alternate",
        }}
      >
        🚌
      </div>

      <div
        style={{
          height: "8px",
          borderRadius: "999px",
          background: "#374151",
          marginTop: "12px",
        }}
      />

    </div>

  );

}
  const roadStyle = {
    height: "8px",
    background:
      "repeating-linear-gradient(to right,#374151 0px,#374151 40px,#facc15 40px,#facc15 60px)",
    borderRadius: "999px",
    marginTop: "15px",
    animation: "roadMove 0.8s linear infinite",
    backgroundSize: "120px 8px",
  };

  return (

    <div
      style={{
        width: "100%",
        padding: "15px 0",
      }}
    >

      <style>
        {`
          @keyframes roadMove{
            from{
              background-position:0 0;
            }
            to{
              background-position:-120px 0;
            }
          }

          @keyframes busBounce{
            from{
              transform:translateY(0px);
            }
            to{
              transform:translateY(-6px);
            }
          }
        `}
      </style>
      <div
        style={{
          textAlign: "center",
          fontSize: "54px",
          animation: "busBounce .8s ease-in-out infinite alternate",
        }}
      >
        🚌
      </div>

      <div style={roadStyle} />

    </div>

  );

}

export default JourneyBus;

