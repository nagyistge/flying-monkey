function _precompile_()
    ccall(:jl_generating_output, Cint, ()) == 1 || return nothing
    precompile(kalman.deltaT, (ASCIIString,))
    precompile(kalman.recordSampleTime, (ASCIIString, Int32,))
    precompile(kalman.fThunk, (ASCIIString,))
    precompile(kalman.initialGuess, (Array{Float64, 1}, Array{Float64, 1},))
    precompile(kalman.qThunk, (ASCIIString, Float64,))
    precompile(kalman.newModel, (ASCIIString, Float64, Float64, Int32,))
end
