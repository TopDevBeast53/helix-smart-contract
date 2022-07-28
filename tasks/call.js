task("call", "Call a deployed contract's function with optional arguments")
    .addPositionalParam("task")
    .addOptionalParam("arg0")
    .addOptionalParam("arg1")
    .addOptionalParam("arg2")
    .addOptionalParam("arg3")
    .addOptionalParam("arg4")
    .addOptionalParam("arg5")
    .addOptionalParam("arg6")
    .addOptionalParam("arg7")
    .addOptionalParam("arg8")
    .addOptionalParam("arg9")
    .setAction(async (args, hre) => {
        const argsObj = {}
        if (args.arg0 != undefined) argsObj.arg0 = args.arg0
        if (args.arg1 != undefined) argsObj.arg1 = args.arg1
        if (args.arg2 != undefined) argsObj.arg2 = args.arg2
        if (args.arg3 != undefined) argsObj.arg3 = args.arg3
        if (args.arg4 != undefined) argsObj.arg4 = args.arg4
        if (args.arg5 != undefined) argsObj.arg5 = args.arg5
        if (args.arg6 != undefined) argsObj.arg6 = args.arg6
        if (args.arg7 != undefined) argsObj.arg7 = args.arg7
        if (args.arg8 != undefined) argsObj.arg8 = args.arg8
        if (args.arg9 != undefined) argsObj.arg9 = args.arg9

        await hre.run(args.task, argsObj)
    })

