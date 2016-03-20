function _precompile_()
    ccall(:jl_generating_output, Cint, ()) == 1 || return nothing
    precompile(PDMats.call, (Type{PDMats.PDMat}, Array{Float64, 2}, Base.LinAlg.Cholesky{Float64, Array{Float64, 2}},))
    precompile(PDMats.call, (Type{PDMats.PDiagMat}, Array{Float64, 1}, Array{Float64, 1},))
    precompile(PDMats.full, (PDMats.PDiagMat{Float64, Array{Float64, 1}},))
end
