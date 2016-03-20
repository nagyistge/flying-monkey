function _precompile_()
    ccall(:jl_generating_output, Cint, ()) == 1 || return nothing
    precompile(Distributions.call, (Type{Distributions.MvNormal}, Array{Float64, 1}, PDMats.PDMat{Float64, Array{Float64, 2}},))
    precompile(Distributions.call, (Type{Distributions.MvNormal}, Array{Float64, 1}, PDMats.PDiagMat{Float64, Array{Float64, 1}},))
    precompile(Distributions.call, (Type{Distributions.MvNormal}, Array{Float64, 1}, Array{Float64, 2},))
end
